import { splitByRowBreaks } from '@domain/excel';
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

  it('fitToPage を sheetPr から正しく読み取る', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
        <sheetData>
          <row r="1"><c r="A1"><v>1</v></c></row>
        </sheetData>
        <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
      </worksheet>`,
    });
    const sheets = await readXlsx(buffer);
    expect(sheets[0]?.pageSetup.fitToPage).toBe(true);
    expect(sheets[0]?.pageSetup.fitToWidth).toBe(1);
    expect(sheets[0]?.pageSetup.fitToHeight).toBe(0);
  });

  it('複数ページの帳票（fitToPage + rowBreaks）で splitByRowBreaks に必要なデータを返す', async () => {
    // 行 1-10 にデータ、行 10 でブレーク、行 11-20 にデータ
    const rows: string[] = [];
    for (let r = 1; r <= 20; r++) {
      rows.push(`<row r="${r}" ht="20"><c r="A${r}"><v>${r}</v></c></row>`);
    }
    const buffer = await buildXlsxBuffer({
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
        <cols><col min="1" max="8" width="10"/></cols>
        <sheetData>${rows.join('')}</sheetData>
        <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
        <pageMargins top="0.79" bottom="0.59" left="0.51" right="0.51" header="0.31" footer="0.31"/>
        <rowBreaks count="1"><brk id="10" max="16383" man="1"/></rowBreaks>
      </worksheet>`,
    });

    const sheets = await readXlsx(buffer);
    const sheet = sheets[0];
    expect(sheet).toBeDefined();

    // 基本データ
    expect(sheet?.cells).toHaveLength(20);
    expect(sheet?.rowBreaks).toEqual([10]);
    expect(sheet?.pageSetup.fitToPage).toBe(true);

    // rowHeights がブレーク後の行も含む（splitByRowBreaks に必要）
    expect(sheet?.rowHeights.length).toBeGreaterThanOrEqual(20);
    expect(sheet?.rowHeights[0]).toBe(20); // 行1
    expect(sheet?.rowHeights[19]).toBe(20); // 行20

    // 列幅
    expect(sheet?.columnWidths.length).toBeGreaterThanOrEqual(1);
  });

  it('rowBreaks が最終行の場合でも rowHeights が十分拡張される', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>
          <row r="1" ht="20"><c r="A1"><v>1</v></c></row>
          <row r="5" ht="20"><c r="A5"><v>5</v></c></row>
        </sheetData>
        <rowBreaks count="1"><brk id="5" max="16383" man="1"/></rowBreaks>
      </worksheet>`,
    });

    const sheets = await readXlsx(buffer);
    // rowBreaks=[5] → maxBreakRow=6 → totalRows=max(5,6,5)=6
    expect(sheets[0]?.rowHeights.length).toBe(6);
  });

  it('readXlsx → splitByRowBreaks で複数ページに正しく分割される', async () => {
    const rows: string[] = [];
    for (let r = 1; r <= 20; r++) {
      rows.push(`<row r="${r}" ht="20"><c r="A${r}"><v>${r}</v></c></row>`);
    }
    const buffer = await buildXlsxBuffer({
      sheet1Xml: `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
        <cols><col min="1" max="1" width="10"/></cols>
        <sheetData>${rows.join('')}</sheetData>
        <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
        <rowBreaks count="1"><brk id="10" max="16383" man="1"/></rowBreaks>
      </worksheet>`,
    });

    const sheets = await readXlsx(buffer);
    const raw = sheets[0];
    expect(raw).toBeDefined();

    const pages = splitByRowBreaks(raw!);
    expect(pages).toHaveLength(2);

    // ページ 1: 行 1-10
    expect(pages[0]?.cells).toHaveLength(10);
    expect(pages[0]?.cells[0]?.value).toBe('1');
    expect(pages[0]?.cells[0]?.row).toBe(1);
    expect(pages[0]?.cells[9]?.value).toBe('10');
    expect(pages[0]?.cells[9]?.row).toBe(10);
    expect(pages[0]?.rowHeights).toHaveLength(10);
    expect(pages[0]?.pageSetup.fitToPage).toBe(true);

    // ページ 2: 行 11-20（リマップで 1-10 に）
    expect(pages[1]?.cells).toHaveLength(10);
    expect(pages[1]?.cells[0]?.value).toBe('11');
    expect(pages[1]?.cells[0]?.row).toBe(1);
    expect(pages[1]?.cells[0]?.address).toBe('A1');
    expect(pages[1]?.cells[9]?.value).toBe('20');
    expect(pages[1]?.cells[9]?.row).toBe(10);
    expect(pages[1]?.rowHeights).toHaveLength(10);
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
