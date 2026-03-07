/**
 * 複数ページ xlsx の E2E テスト
 *
 * readXlsx → splitByRowBreaks → parseSheet の全パイプラインを検証する。
 */
import { parseSheet, splitByRowBreaks } from '@domain/excel';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { readXlsx } from './XlsxReader';

/** xlsx zip を構築するヘルパー */
async function buildXlsxBuffer(opts: {
  workbookXml?: string;
  relsXml?: string;
  sheet1Xml: string;
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

  zip.file('xl/worksheets/sheet1.xml', opts.sheet1Xml);
  return zip.generateAsync({ type: 'arraybuffer' });
}

function colNumToLetter(n: number): string {
  let result = '';
  let num = n;
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

/** シート XML を生成 */
function buildSheetXml(opts: {
  rows: { r: number; ht: number; cells: { col: string; value: string }[] }[];
  cols: { min: number; max: number; width: number }[];
  rowBreaks: number[];
  fitToPage?: boolean;
  fitToWidth?: number;
  fitToHeight?: number;
  paperSize?: number;
  orientation?: string;
}): string {
  const maxRow = Math.max(...opts.rows.map((r) => r.r));
  const maxCol = opts.cols.length > 0 ? Math.max(...opts.cols.map((c) => c.max)) : 1;

  const sheetPr = opts.fitToPage ? `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>` : '';

  const colsXml =
    opts.cols.length > 0
      ? `<cols>${opts.cols.map((c) => `<col min="${c.min}" max="${c.max}" width="${c.width}" customWidth="1"/>`).join('')}</cols>`
      : '';

  const rowsXml = opts.rows
    .map((row) => {
      const cellsXml = row.cells
        .map((c) => `<c r="${c.col}${row.r}"><v>${c.value}</v></c>`)
        .join('');
      return `<row r="${row.r}" ht="${row.ht}" customHeight="1">${cellsXml}</row>`;
    })
    .join('');

  const psAttrs: string[] = [];
  if (opts.paperSize) psAttrs.push(`paperSize="${opts.paperSize}"`);
  if (opts.orientation) psAttrs.push(`orientation="${opts.orientation}"`);
  if (opts.fitToWidth !== undefined) psAttrs.push(`fitToWidth="${opts.fitToWidth}"`);
  if (opts.fitToHeight !== undefined) psAttrs.push(`fitToHeight="${opts.fitToHeight}"`);
  const pageSetup = psAttrs.length > 0 ? `<pageSetup ${psAttrs.join(' ')}/>` : '';

  const rowBreaksXml =
    opts.rowBreaks.length > 0
      ? `<rowBreaks count="${opts.rowBreaks.length}" manualBreakCount="${opts.rowBreaks.length}">
        ${opts.rowBreaks.map((b) => `<brk id="${b}" max="16383" man="1"/>`).join('')}
      </rowBreaks>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  ${sheetPr}
  <dimension ref="A1:${colNumToLetter(maxCol)}${maxRow}"/>
  <sheetFormatPr defaultRowHeight="15"/>
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
  ${pageSetup}
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
  ${rowBreaksXml}
</worksheet>`;
}

function makeRows(start: number, end: number, ht = 20) {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    r: start + i,
    ht,
    cells: [{ col: 'A', value: String(start + i) }],
  }));
}

describe('複数ページ E2E', () => {
  it('2ページ分割: 全パイプラインでボックスが生成される', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: buildSheetXml({
        rows: makeRows(1, 20),
        cols: [{ min: 1, max: 8, width: 10 }],
        rowBreaks: [10],
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
        orientation: 'portrait',
      }),
    });

    const sheets = await readXlsx(buffer);
    const raw = sheets[0];
    expect(raw).toBeDefined();
    expect(raw?.cells).toHaveLength(20);
    expect(raw?.rowBreaks).toEqual([10]);
    expect(raw?.pageSetup.fitToPage).toBe(true);

    const pages = splitByRowBreaks(raw!);
    expect(pages).toHaveLength(2);

    for (const page of pages) {
      expect(page.cells).toHaveLength(10);
      expect(page.pageSetup.fitToHeight).toBe(1);

      const parsed = parseSheet(page);
      expect(parsed.boxes.length).toBeGreaterThan(0);
      for (const box of parsed.boxes) {
        expect(box.rect.size.width).toBeGreaterThan(0);
        expect(box.rect.size.height).toBeGreaterThan(0);
      }
    }
  });

  it('3ページ分割が正しく動作する', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: buildSheetXml({
        rows: makeRows(1, 30),
        cols: [{ min: 1, max: 8, width: 10 }],
        rowBreaks: [10, 20],
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
      }),
    });

    const sheets = await readXlsx(buffer);
    expect(sheets[0]).toBeDefined();
    const pages = splitByRowBreaks(sheets[0]!);
    expect(pages).toHaveLength(3);
    for (const page of pages) {
      expect(parseSheet(page).boxes.length).toBeGreaterThan(0);
    }
  });

  it('printArea 付き複数ページで正しく動作する', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: buildSheetXml({
        rows: makeRows(1, 20).map((r) => ({
          ...r,
          cells: [
            { col: 'A', value: `R${r.r}` },
            { col: 'H', value: `H${r.r}` },
          ],
        })),
        cols: [{ min: 1, max: 8, width: 10 }],
        rowBreaks: [10],
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
      }),
      workbookXml: `<?xml version="1.0" encoding="UTF-8"?>
        <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
                  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
          <definedNames>
            <definedName name="_xlnm.Print_Area" localSheetId="0">'Sheet1'!$A$1:$H$20</definedName>
          </definedNames>
        </workbook>`,
    });

    const sheets = await readXlsx(buffer);
    const raw = sheets[0];
    expect(raw).toBeDefined();
    expect(raw?.pageSetup.printArea).toBe('A1:H20');

    const pages = splitByRowBreaks(raw!);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(parseSheet(page).boxes.length).toBeGreaterThan(0);
    }
  });

  it('scale モード（fitToPage なし）の複数ページ', async () => {
    const buffer = await buildXlsxBuffer({
      sheet1Xml: buildSheetXml({
        rows: makeRows(1, 20),
        cols: [{ min: 1, max: 1, width: 10 }],
        rowBreaks: [10],
        paperSize: 9,
      }),
    });

    const sheets = await readXlsx(buffer);
    expect(sheets[0]).toBeDefined();
    const pages = splitByRowBreaks(sheets[0]!);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(parseSheet(page).boxes.length).toBeGreaterThan(0);
    }
  });
});
