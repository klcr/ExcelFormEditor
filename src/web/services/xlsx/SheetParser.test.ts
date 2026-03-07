import { describe, expect, it } from 'vitest';
import { parseWorksheet } from './SheetParser';
import { parseStyles } from './StylesParser';

const stylesXml = `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="游ゴシック"/></font>
    <font><b/><sz val="14"/><name val="MS Gothic"/><color rgb="FFFF0000"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FF000000"/></left>
      <right style="thin"><color rgb="FF000000"/></right>
      <top style="thin"><color rgb="FF000000"/></top>
      <bottom style="thin"><color rgb="FF000000"/></bottom>
    </border>
  </borders>
  <cellXfs count="3">
    <xf fontId="0" fillId="0" borderId="0"/>
    <xf fontId="1" fillId="2" borderId="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
    <xf fontId="0" fillId="0" borderId="1"/>
  </cellXfs>
</styleSheet>`;

const styles = parseStyles(stylesXml);
const sharedStrings = ['請求書', 'Hello', 'World'];

describe('parseWorksheet', () => {
  it('セルを抽出する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c></row>
        <row r="2"><c r="B2"><v>12345</v></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, sharedStrings, styles);
    expect(result.cells).toHaveLength(2);
    expect(result.cells[0]).toMatchObject({
      address: 'A1',
      row: 1,
      col: 1,
      value: '請求書',
    });
    expect(result.cells[1]).toMatchObject({
      address: 'B2',
      row: 2,
      col: 2,
      value: '12345',
    });
  });

  it('スタイル付きセルを抽出する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" s="1" t="s"><v>0</v></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, sharedStrings, styles);
    const cell = result.cells[0];
    expect(cell?.style.font).toEqual({
      name: 'MS Gothic',
      size: 14,
      bold: true,
      italic: undefined,
      color: 'FF0000',
    });
    expect(cell?.style.fill).toEqual({ color: 'FFFF00' });
    expect(cell?.style.border?.top).toEqual({ style: 'thin', color: '000000' });
    expect(cell?.style.alignment).toEqual({
      horizontal: 'center',
      vertical: 'top',
      wrapText: true,
    });
  });

  it('空セルでもスタイルがあれば収集する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" s="2"/></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, sharedStrings, styles);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0]?.value).toBe('');
    expect(result.cells[0]?.style.border?.top).toEqual({ style: 'thin', color: '000000' });
  });

  it('数式セルのキャッシュ結果を返す', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1"><f>B2*2</f><v>24690</v></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, sharedStrings, styles);
    expect(result.cells[0]?.value).toBe('24690');
  });

  it('列幅を抽出する（min〜max 展開）', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <cols>
        <col min="1" max="1" width="8.43"/>
        <col min="2" max="3" width="15"/>
        <col min="4" max="4" width="20"/>
      </cols>
      <sheetData/>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.columnWidths).toEqual([8.43, 15, 15, 20]);
  });

  it('行高を抽出する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1" ht="20"><c r="A1"><v>1</v></c></row>
        <row r="2" ht="25"><c r="A2"><v>2</v></c></row>
        <row r="3"><c r="A3"><v>3</v></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.rowHeights).toEqual([20, 25, 15]);
  });

  it('結合セルを抽出する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData/>
      <mergeCells count="2">
        <mergeCell ref="A1:C1"/>
        <mergeCell ref="D2:D4"/>
      </mergeCells>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.merges).toEqual(['A1:C1', 'D2:D4']);
  });

  it('ページ設定を抽出する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData/>
      <pageSetup paperSize="9" orientation="portrait" scale="80"/>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.pageSetup).toEqual({
      paperSize: 9,
      orientation: 'portrait',
      scale: 80,
    });
  });

  it('fitToPage を <sheetPr><pageSetUpPr> から抽出する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
      <sheetData/>
      <pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.pageSetup.fitToPage).toBe(true);
    expect(result.pageSetup.fitToWidth).toBe(1);
    expect(result.pageSetup.fitToHeight).toBe(0);
  });

  it('sheetPr が無い場合 fitToPage は設定されない', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData/>
      <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1"/>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.pageSetup.fitToPage).toBeUndefined();
  });

  it('マージンを抽出する（インチ単位）', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData/>
      <pageMargins top="0.79" bottom="0.59" left="0.51" right="0.51" header="0.31" footer="0.31"/>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.margins).toEqual({
      top: 0.79,
      bottom: 0.59,
      left: 0.51,
      right: 0.51,
      header: 0.31,
      footer: 0.31,
    });
  });

  it('行改ページを抽出する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData/>
      <rowBreaks count="2" manualBreakCount="2">
        <brk id="10" max="16383" man="1"/>
        <brk id="20" max="16383" man="1"/>
      </rowBreaks>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.rowBreaks).toEqual([10, 20]);
  });

  it('空のワークシートを処理する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData/>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.cells).toEqual([]);
    expect(result.merges).toEqual([]);
    expect(result.columnWidths).toEqual([]);
    expect(result.rowHeights).toEqual([]);
    expect(result.pageSetup).toEqual({});
    expect(result.margins).toBeNull();
    expect(result.rowBreaks).toEqual([]);
  });

  it('defaultColWidth / defaultRowHeight を使用する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetFormatPr defaultColWidth="10" defaultRowHeight="18"/>
      <sheetData>
        <row r="1"><c r="B1"><v>1</v></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    // col A のデフォルト幅は 10
    expect(result.columnWidths[0]).toBe(10);
    // row 1 の明示 ht なし → defaultRowHeight 18
    expect(result.rowHeights[0]).toBe(18);
  });

  it('エラーセルを処理する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" t="e"><v>#REF!</v></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.cells[0]?.value).toBe('#REF!');
  });

  it('ブールセルを処理する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" t="b"><v>1</v></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.cells[0]?.value).toBe('true');
  });

  it('インライン文字列を処理する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" t="inlineStr"><is><t>inline text</t></is></c></row>
      </sheetData>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    expect(result.cells[0]?.value).toBe('inline text');
  });

  it('rowBreaks がある場合、rowHeights をブレーク行以降まで拡張する', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1" ht="20"><c r="A1"><v>page1</v></c></row>
        <row r="2" ht="20"><c r="A2"><v>page1</v></c></row>
      </sheetData>
      <rowBreaks count="1"><brk id="2" max="16383" man="1"/></rowBreaks>
    </worksheet>`;

    const result = parseWorksheet(xml, [], null);
    // rowBreaks=[2] → maxBreakRow=3 → totalRows=max(2,3,2)=3
    expect(result.rowHeights).toHaveLength(3);
    expect(result.rowBreaks).toEqual([2]);
  });

  it('複数ページの帳票（fitToPage + rowBreaks）を正しくパースする', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
      <sheetFormatPr defaultRowHeight="15"/>
      <cols><col min="1" max="8" width="10"/></cols>
      <sheetData>
        <row r="1" ht="30"><c r="A1" t="s"><v>0</v></c></row>
        <row r="10" ht="20"><c r="A10"><v>page1-last</v></c></row>
        <row r="11" ht="30"><c r="A11"><v>page2-first</v></c></row>
        <row r="20" ht="20"><c r="A20"><v>page2-last</v></c></row>
      </sheetData>
      <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
      <pageMargins top="0.79" bottom="0.59" left="0.51" right="0.51" header="0.31" footer="0.31"/>
      <rowBreaks count="1"><brk id="10" max="16383" man="1"/></rowBreaks>
    </worksheet>`;

    const result = parseWorksheet(xml, sharedStrings, null);

    expect(result.pageSetup.fitToPage).toBe(true);
    expect(result.pageSetup.fitToWidth).toBe(1);
    expect(result.pageSetup.fitToHeight).toBe(0);
    expect(result.rowBreaks).toEqual([10]);
    // rowHeights: max(20, 11, 20) = 20 → でも maxBreakRow = 11
    // totalRows = max(20, 11, 20) = 20
    expect(result.rowHeights.length).toBeGreaterThanOrEqual(20);
    expect(result.cells).toHaveLength(4);
  });
});

// --- 非表示行列テスト ---

describe('hidden rows and columns', () => {
  it('非表示行の高さを 0 として返す', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1" ht="20"><c r="A1"><v>1</v></c></row>
        <row r="2" ht="20" hidden="1"><c r="A2"><v>2</v></c></row>
        <row r="3" ht="20"><c r="A3"><v>3</v></c></row>
      </sheetData>
    </worksheet>`;
    const result = parseWorksheet(xml, [], null);
    expect(result.rowHeights[0]).toBe(20);
    expect(result.rowHeights[1]).toBe(0); // 非表示
    expect(result.rowHeights[2]).toBe(20);
  });

  it('非表示列の幅を 0 として返す', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <cols>
        <col min="1" max="1" width="10"/>
        <col min="2" max="2" width="10" hidden="1"/>
        <col min="3" max="3" width="10"/>
      </cols>
      <sheetData>
        <row r="1"><c r="A1"><v>1</v></c></row>
      </sheetData>
    </worksheet>`;
    const result = parseWorksheet(xml, [], null);
    expect(result.columnWidths[0]).toBe(10);
    expect(result.columnWidths[1]).toBe(0); // 非表示
    expect(result.columnWidths[2]).toBe(10);
  });
});
