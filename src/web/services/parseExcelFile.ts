import type { ParsedSheet, RawCell, RawSheetData } from '@domain/excel';
import { parseSheet } from '@domain/excel';
import ExcelJS from 'exceljs';

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

/** ドメイン変換込みの完全パース結果 */
export type FullParseResult = {
  readonly debug: ExcelParseResult;
  readonly parsed: readonly ParsedSheet[];
};

const MAX_SAMPLE_CELLS = 20;

/** ExcelJS の paperSize 番号を文字列に変換 */
function paperSizeLabel(ps: number | undefined): string {
  const map: Record<number, string> = { 8: 'A3', 9: 'A4', 11: 'A5' };
  if (ps === undefined) return '不明';
  return map[ps] ?? `その他(${ps})`;
}

/** セル値を表示用文字列に変換 */
function formatCellValue(value: ExcelJS.CellValue): { text: string; type: string } {
  if (value === null || value === undefined) return { text: '', type: 'empty' };
  if (typeof value === 'string') return { text: value, type: 'string' };
  if (typeof value === 'number') return { text: String(value), type: 'number' };
  if (typeof value === 'boolean') return { text: String(value), type: 'boolean' };
  if (value instanceof Date) return { text: value.toLocaleDateString('ja-JP'), type: 'date' };
  if (typeof value === 'object') {
    // Date duck-typing（jsdom環境で instanceof Date が失敗する場合の対策）
    if (typeof (value as unknown as Date).getTime === 'function') {
      return { text: (value as unknown as Date).toLocaleDateString('ja-JP'), type: 'date' };
    }
    // 数式セル: { formula: "...", result: ... }
    if ('formula' in value) {
      const formulaValue = value as { formula: string; result?: unknown };
      const result = formulaValue.result;
      if (result === null || result === undefined) {
        return { text: '', type: 'formula' };
      }
      if (typeof result === 'object' && result !== null && 'error' in result) {
        return { text: String((result as { error: string }).error), type: 'formula' };
      }
      return { text: String(result), type: 'formula' };
    }
    // 共有数式セル: { sharedFormula: "..." }（result を持たない場合がある）
    if ('sharedFormula' in value) {
      const shared = value as { sharedFormula: string; result?: unknown };
      if (shared.result !== null && shared.result !== undefined) {
        if (typeof shared.result === 'object' && 'error' in shared.result) {
          return { text: String((shared.result as { error: string }).error), type: 'formula' };
        }
        return { text: String(shared.result), type: 'formula' };
      }
      return { text: '', type: 'formula' };
    }
    // リッチテキスト
    if ('richText' in value) {
      const text = value.richText.map((rt) => rt.text).join('');
      return { text, type: 'richText' };
    }
    // エラーセル: { error: "#REF!" } など
    if ('error' in value) {
      return { text: String((value as { error: string }).error), type: 'error' };
    }
    // ハイパーリンク: { text: "...", hyperlink: "..." }
    if ('text' in value) {
      return { text: String((value as { text: string }).text), type: 'hyperlink' };
    }
  }
  return { text: String(value), type: 'unknown' };
}

/** ARGB 文字列から先頭の 'FF' を除去して 6 桁 hex にする */
function argbToHex(argb?: string): string | undefined {
  if (!argb) return undefined;
  return argb.length === 8 ? argb.slice(2) : argb;
}

/** ExcelJS の Fill から背景色を抽出する */
function extractFillColor(fill: ExcelJS.Fill | undefined | null): string | undefined {
  if (!fill || fill.type !== 'pattern') return undefined;
  const patternFill = fill as ExcelJS.FillPattern;
  return argbToHex(patternFill.fgColor?.argb);
}

/** ExcelJS の border を RawCell 用の border 構造に変換する */
function extractBorderData(
  borderRaw: Partial<ExcelJS.Borders> | undefined | null,
): RawCell['style']['border'] {
  if (!borderRaw) return undefined;
  return {
    top: borderRaw.top
      ? { style: borderRaw.top.style, color: argbToHex(borderRaw.top.color?.argb) }
      : undefined,
    bottom: borderRaw.bottom
      ? { style: borderRaw.bottom.style, color: argbToHex(borderRaw.bottom.color?.argb) }
      : undefined,
    left: borderRaw.left
      ? { style: borderRaw.left.style, color: argbToHex(borderRaw.left.color?.argb) }
      : undefined,
    right: borderRaw.right
      ? { style: borderRaw.right.style, color: argbToHex(borderRaw.right.color?.argb) }
      : undefined,
  };
}

/** 列番号 → 列文字（1=A, 2=B, ..., 26=Z, 27=AA） */
function colNumToLetter(col: number): string {
  let result = '';
  let n = col;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/** 列文字 → 列番号（A=1, B=2, ..., Z=26, AA=27） */
function letterToColNum(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result;
}

/**
 * 結合範囲の外周セルから罫線データを補完収集する。
 * eachCell({ includeEmpty: false }) でスキップされた空のスレーブセルが
 * 罫線データを保持している場合があるため、外周のみを追加取得する。
 */
function collectMergePerimeterCells(
  ws: ExcelJS.Worksheet,
  merges: readonly string[],
  collectedAddresses: Set<string>,
): RawCell[] {
  const extraCells: RawCell[] = [];

  for (const range of merges) {
    const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!match) continue;

    const [, startColStr, startRowStr, endColStr, endRowStr] = match;
    if (!startColStr || !startRowStr || !endColStr || !endRowStr) continue;

    const startCol = letterToColNum(startColStr);
    const startRow = Number(startRowStr);
    const endCol = letterToColNum(endColStr);
    const endRow = Number(endRowStr);

    // 外周セルのアドレスを列挙
    const perimeterAddresses = new Set<string>();
    for (let c = startCol; c <= endCol; c++) {
      perimeterAddresses.add(colNumToLetter(c) + startRow);
      perimeterAddresses.add(colNumToLetter(c) + endRow);
    }
    for (let r = startRow + 1; r < endRow; r++) {
      perimeterAddresses.add(colNumToLetter(startCol) + r);
      perimeterAddresses.add(colNumToLetter(endCol) + r);
    }

    for (const addr of perimeterAddresses) {
      if (collectedAddresses.has(addr)) continue;

      const cell = ws.getCell(addr);
      const border = extractBorderData(cell.border);
      if (!border) continue;

      collectedAddresses.add(addr);
      extraCells.push({
        address: addr,
        row: Number(cell.row),
        col: Number(cell.col),
        value: '',
        style: { border },
        isMerged: true,
      });
    }
  }

  return extraCells;
}

/** ExcelJS のワークシートを RawSheetData に変換する */
function worksheetToRawSheetData(ws: ExcelJS.Worksheet): RawSheetData {
  const margins = ws.pageSetup.margins;
  const merges: string[] = ws.model.merges ?? [];

  const mergeByMaster = new Map<string, string>();
  for (const range of merges) {
    const match = range.match(/^([A-Z]+\d+):/);
    if (match) {
      const masterAddr = match[1];
      if (masterAddr) {
        mergeByMaster.set(masterAddr, range);
      }
    }
  }

  const colCount = ws.columnCount || 0;
  const columnWidths: number[] = [];
  for (let c = 1; c <= colCount; c++) {
    columnWidths.push(ws.getColumn(c).width ?? 8.43);
  }

  const rowCount = ws.rowCount || 0;
  const rowHeights: number[] = [];
  for (let r = 1; r <= rowCount; r++) {
    const row = ws.getRow(r);
    rowHeights.push(row.height ?? 15);
  }

  const cells: RawCell[] = [];
  const collectedAddresses = new Set<string>();

  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const { text } = formatCellValue(cell.value);

      collectedAddresses.add(cell.address);
      cells.push({
        address: cell.address,
        row: Number(cell.row),
        col: Number(cell.col),
        value: text,
        style: {
          font: cell.font
            ? {
                name: cell.font.name,
                size: cell.font.size,
                bold: cell.font.bold,
                italic: cell.font.italic,
                color: argbToHex(cell.font.color?.argb),
              }
            : undefined,
          border: extractBorderData(cell.border),
          fill: extractFillColor(cell.fill)
            ? { color: extractFillColor(cell.fill) as string }
            : undefined,
          alignment: cell.alignment
            ? {
                horizontal: cell.alignment.horizontal,
                vertical: cell.alignment.vertical,
                wrapText: cell.alignment.wrapText,
              }
            : undefined,
        },
        isMerged: cell.isMerged,
        mergeRange: mergeByMaster.get(cell.address),
      });
    });
  });

  // 結合範囲の外周セルから罫線データを補完収集（事象 001 修正）
  const perimeterCells = collectMergePerimeterCells(ws, merges, collectedAddresses);
  cells.push(...perimeterCells);

  return {
    name: ws.name,
    pageSetup: {
      paperSize: ws.pageSetup.paperSize,
      orientation: ws.pageSetup.orientation,
      scale: ws.pageSetup.scale,
      fitToPage: ws.pageSetup.fitToPage,
      fitToWidth: ws.pageSetup.fitToWidth,
      fitToHeight: ws.pageSetup.fitToHeight,
      printArea: ws.pageSetup.printArea,
    },
    margins: margins
      ? {
          top: margins.top,
          bottom: margins.bottom,
          left: margins.left,
          right: margins.right,
          header: margins.header,
          footer: margins.footer,
        }
      : null,
    columnWidths,
    rowHeights,
    cells,
    merges,
  };
}

/** デバッグ用のシート情報を抽出する */
function worksheetToDebugResult(ws: ExcelJS.Worksheet): SheetParseResult {
  const margins = ws.pageSetup.margins;
  const merges: string[] = ws.model.merges ?? [];

  const columns: { col: number; width: number | undefined }[] = [];
  for (let c = 1; c <= (ws.columnCount || 0); c++) {
    const col = ws.getColumn(c);
    if (col.width !== undefined) {
      columns.push({ col: c, width: col.width });
    }
  }

  const rows: { row: number; height: number }[] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    rows.push({ row: row.number, height: row.height ?? 15 });
  });

  const sampleCells: CellSample[] = [];
  let cellCount = 0;

  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      cellCount++;
      if (sampleCells.length < MAX_SAMPLE_CELLS) {
        const { text, type } = formatCellValue(cell.value);
        sampleCells.push({
          address: cell.address,
          value: text,
          type,
          isMerged: cell.isMerged,
          font: cell.font?.name,
          hasBorder: cell.border !== undefined && cell.border !== null,
          hasFill: cell.fill !== undefined && cell.fill !== null,
        });
      }
    });
  });

  return {
    name: ws.name,
    pageSetup: {
      paperSize: ws.pageSetup.paperSize,
      orientation: ws.pageSetup.orientation,
      scale: ws.pageSetup.scale,
      fitToPage: ws.pageSetup.fitToPage,
      fitToWidth: ws.pageSetup.fitToWidth,
      fitToHeight: ws.pageSetup.fitToHeight,
      printArea: ws.pageSetup.printArea,
    },
    margins: margins
      ? {
          top: margins.top,
          bottom: margins.bottom,
          left: margins.left,
          right: margins.right,
          header: margins.header,
          footer: margins.footer,
        }
      : null,
    merges,
    columns,
    rows,
    cellCount,
    sampleCells,
  };
}

/** .xlsx ファイルをパースしてドメイン変換結果とデバッグ情報を返す */
export async function parseExcelFile(file: File): Promise<FullParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const debugSheets: SheetParseResult[] = [];
  const parsedSheets: ParsedSheet[] = [];

  workbook.eachSheet((ws) => {
    debugSheets.push(worksheetToDebugResult(ws));

    const rawData = worksheetToRawSheetData(ws);
    parsedSheets.push(parseSheet(rawData));
  });

  return {
    debug: {
      fileName: file.name,
      sheetCount: debugSheets.length,
      sheets: debugSheets,
    },
    parsed: parsedSheets,
  };
}

export { paperSizeLabel };
