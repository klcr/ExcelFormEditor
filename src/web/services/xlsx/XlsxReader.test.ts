import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { readXlsx } from './XlsxReader';

/** 最小限の xlsx zip を構築するヘルパー */
async function buildXlsxBuffer(opts: {
  workbookXml?: string;
  relsXml?: string;
  sheet1Xml?: string;
  sharedStringsXml?: string;
  stylesXml?: string;
}): Promise<ArrayBuffer> {
  const zip = new JSZip();

  zip.file(
    'xl/workbook.xml',
    opts.workbookXml ??
      `<?xml version="1.0" encoding="UTF-8"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`,
  );

  zip.file(
    'xl/_rels/workbook.xml.rels',
    opts.relsXml ??
      `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Target="worksheets/sheet1.xml"/>
    </Relationships>`,
  );

  zip.file(
    'xl/worksheets/sheet1.xml',
    opts.sheet1Xml ??
      `<?xml version="1.0" encoding="UTF-8"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c></row>
      </sheetData>
    </worksheet>`,
  );

  if (opts.sharedStringsXml) {
    zip.file('xl/sharedStrings.xml', opts.sharedStringsXml);
  } else {
    zip.file(
      'xl/sharedStrings.xml',
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <si><t>Hello</t></si>
      </sst>`,
    );
  }

  if (opts.stylesXml) {
    zip.file('xl/styles.xml', opts.stylesXml);
  }

  return zip.generateAsync({ type: 'arraybuffer' });
}

describe('readXlsx', () => {
  it('基本的な xlsx を読み込み RawSheetData を返す', async () => {
    const buffer = await buildXlsxBuffer({});
    const sheets = await readXlsx(buffer);

    expect(sheets).toHaveLength(1);
    expect(sheets[0]?.name).toBe('Sheet1');
    expect(sheets[0]?.cells).toHaveLength(1);
    expect(sheets[0]?.cells[0]).toMatchObject({
      address: 'A1',
      row: 1,
      col: 1,
      value: 'Hello',
    });
  });

  it('結合セルの isMerged と mergeRange を設定する', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>
          <row r="1">
            <c r="A1" t="s"><v>0</v></c>
            <c r="B1"><v>1</v></c>
          </row>
        </sheetData>
        <mergeCells><mergeCell ref="A1:B1"/></mergeCells>
      </worksheet>`,
    });
    const sheets = await readXlsx(buffer);
    const cells = sheets[0]?.cells ?? [];

    const a1 = cells.find((c) => c.address === 'A1');
    const b1 = cells.find((c) => c.address === 'B1');

    expect(a1?.mergeRange).toBe('A1:B1');
    expect(a1?.isMerged).toBe(false); // マスターは isMerged=false
    expect(b1?.isMerged).toBe(true); // スレーブは isMerged=true
  });

  it('スタイル付きセルを読み込む', async () => {
    const buffer = await buildXlsxBuffer({
      stylesXml: `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <fonts count="1"><font><b/><sz val="14"/><name val="Arial"/></font></fonts>
        <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
        <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
        <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellXfs>
      </styleSheet>`,
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>
          <row r="1"><c r="A1" s="0" t="s"><v>0</v></c></row>
        </sheetData>
      </worksheet>`,
    });
    const sheets = await readXlsx(buffer);
    expect(sheets[0]?.cells[0]?.style.font).toEqual({
      name: 'Arial',
      size: 14,
      bold: true,
      italic: undefined,
      color: undefined,
    });
  });

  it('ページ設定とマージンを読み込む', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData/>
        <pageSetup paperSize="9" orientation="portrait" scale="80"/>
        <pageMargins top="0.79" bottom="0.59" left="0.51" right="0.51" header="0.31" footer="0.31"/>
      </worksheet>`,
    });
    const sheets = await readXlsx(buffer);
    expect(sheets[0]?.pageSetup).toEqual({
      paperSize: 9,
      orientation: 'portrait',
      scale: 80,
    });
    expect(sheets[0]?.margins).toEqual({
      top: 0.79,
      bottom: 0.59,
      left: 0.51,
      right: 0.51,
      header: 0.31,
      footer: 0.31,
    });
  });

  it('行改ページを読み込む', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData/>
        <rowBreaks count="1"><brk id="10" max="16383" man="1"/></rowBreaks>
      </worksheet>`,
    });
    const sheets = await readXlsx(buffer);
    expect(sheets[0]?.rowBreaks).toEqual([10]);
  });

  it('workbook の definedNames から printArea をフォールバック取得する', async () => {
    const buffer = await buildXlsxBuffer({
      workbookXml: `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
        <definedNames>
          <definedName name="_xlnm.Print_Area" localSheetId="0">'Sheet1'!$A$1:$H$20</definedName>
        </definedNames>
      </workbook>`,
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData/>
      </worksheet>`,
    });
    const sheets = await readXlsx(buffer);
    expect(sheets[0]?.pageSetup.printArea).toBe('A1:H20');
  });

  it('sharedStrings が無い xlsx を処理する', async () => {
    const zip = new JSZip();
    zip.file(
      'xl/workbook.xml',
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets><sheet name="S1" sheetId="1" r:id="rId1"/></sheets>
      </workbook>`,
    );
    zip.file(
      'xl/_rels/workbook.xml.rels',
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Target="worksheets/sheet1.xml"/>
      </Relationships>`,
    );
    zip.file(
      'xl/worksheets/sheet1.xml',
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData><row r="1"><c r="A1"><v>42</v></c></row></sheetData>
      </worksheet>`,
    );
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    const sheets = await readXlsx(buffer);
    expect(sheets[0]?.cells[0]?.value).toBe('42');
  });
});
