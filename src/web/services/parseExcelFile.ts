import type { ParsedSheet, RawSheetData } from '@domain/excel';
import { parseSheet, splitByRowBreaks } from '@domain/excel';
import { readXlsx } from './xlsx';

/** シートごとのデバッグ用パース結果 */
export type SheetParseResult = {
  readonly name: string;
  readonly pageSetup: {
    readonly paperSize: number | undefined;
    readonly orientation: string | undefined;
    readonly scale: number | undefined;
    readonly fitToPage: boolean | undefined;
    readonly fitToWidth: number | undefined;
    readonly fitToHeight: number | undefined;
    readonly printArea: string | undefined;
  };
  readonly margins: {
    readonly top: number;
    readonly bottom: number;
    readonly left: number;
    readonly right: number;
    readonly header: number;
    readonly footer: number;
  } | null;
  readonly merges: readonly string[];
  readonly columns: readonly { readonly col: number; readonly width: number | undefined }[];
  readonly rows: readonly { readonly row: number; readonly height: number }[];
  readonly cellCount: number;
  readonly sampleCells: readonly CellSample[];
};

/** セルのサンプル情報（最大20件） */
export type CellSample = {
  readonly address: string;
  readonly value: string;
  readonly type: string;
  readonly isMerged: boolean;
  readonly font: string | undefined;
  readonly hasBorder: boolean;
  readonly hasFill: boolean;
};

/** デバッグ用パース結果 */
export type ExcelParseResult = {
  readonly fileName: string;
  readonly sheetCount: number;
  readonly sheets: readonly SheetParseResult[];
};

/** シートごとのパース出力（1シート → 複数ページの可能性あり） */
export type SheetParseOutput = {
  readonly sheetIndex: number;
  readonly sheetName: string;
  readonly pages: readonly ParsedSheet[];
};

/** ドメイン変換込みの完全パース結果 */
export type FullParseResult = {
  readonly debug: ExcelParseResult;
  readonly sheets: readonly SheetParseOutput[];
};

const MAX_SAMPLE_CELLS = 20;

/** paperSize 番号を文字列に変換 */
function paperSizeLabel(ps: number | undefined): string {
  const map: Record<number, string> = { 8: 'A3', 9: 'A4', 11: 'A5' };
  if (ps === undefined) return '不明';
  return map[ps] ?? `その他(${ps})`;
}

/** RawSheetData からデバッグ用のシート情報を導出する */
function rawToDebugResult(raw: RawSheetData): SheetParseResult {
  const columns: { col: number; width: number | undefined }[] = [];
  for (let c = 0; c < raw.columnWidths.length; c++) {
    const w = raw.columnWidths[c];
    if (w !== undefined) {
      columns.push({ col: c + 1, width: w });
    }
  }

  const rowSet = new Set<number>();
  const rows: { row: number; height: number }[] = [];
  for (const cell of raw.cells) {
    if (!rowSet.has(cell.row)) {
      rowSet.add(cell.row);
      const h = raw.rowHeights[cell.row - 1] ?? 15;
      rows.push({ row: cell.row, height: h });
    }
  }
  rows.sort((a, b) => a.row - b.row);

  const sampleCells: CellSample[] = [];
  for (const cell of raw.cells) {
    if (sampleCells.length >= MAX_SAMPLE_CELLS) break;
    sampleCells.push({
      address: cell.address,
      value: cell.value,
      type: cell.value ? 'string' : 'empty',
      isMerged: cell.isMerged,
      font: cell.style.font?.name,
      hasBorder: cell.style.border !== undefined,
      hasFill: cell.style.fill !== undefined,
    });
  }

  return {
    name: raw.name,
    pageSetup: {
      paperSize: raw.pageSetup.paperSize,
      orientation: raw.pageSetup.orientation,
      scale: raw.pageSetup.scale,
      fitToPage: raw.pageSetup.fitToPage,
      fitToWidth: raw.pageSetup.fitToWidth,
      fitToHeight: raw.pageSetup.fitToHeight,
      printArea: raw.pageSetup.printArea,
    },
    margins: raw.margins,
    merges: raw.merges,
    columns,
    rows,
    cellCount: raw.cells.length,
    sampleCells,
  };
}

/** .xlsx ファイルをパースしてドメイン変換結果とデバッグ情報を返す */
export async function parseExcelFile(file: File): Promise<FullParseResult> {
  const buffer = await file.arrayBuffer();
  const rawSheets = await readXlsx(buffer);

  const debugSheets: SheetParseResult[] = [];
  const sheets: SheetParseOutput[] = [];

  for (let i = 0; i < rawSheets.length; i++) {
    const raw = rawSheets[i];
    if (!raw) continue;

    debugSheets.push(rawToDebugResult(raw));

    const subPages = splitByRowBreaks(raw);
    const pages = subPages.map((sub) => parseSheet(sub));

    sheets.push({
      sheetIndex: i,
      sheetName: raw.name,
      pages,
    });
  }

  return {
    debug: {
      fileName: file.name,
      sheetCount: debugSheets.length,
      sheets: debugSheets,
    },
    sheets,
  };
}

export { paperSizeLabel };
