import type { BoxDefinition } from '@domain/box';
import { createBox, generateBoxId, resetBoxIdCounter } from '@domain/box';
import type { HorizontalAlignment, VerticalAlignment } from '@domain/box';
import type { LineDefinition } from '@domain/line';
import { extractLines, resetLineIdCounter } from '@domain/line';
import {
  DEFAULT_MARGINS,
  type Margins,
  type Orientation,
  type PaperCentering,
  type PaperDefinition,
  type PaperSize,
  type ScalingConfig,
  createPaperDefinition,
} from '@domain/paper';
import {
  applyScale,
  calculateEffectiveScale,
  excelColumnWidthToMm,
  ptToMm,
} from '@domain/paper/CoordinateConverter';
import { buildCellMap, collectMergeBorder, convertBorder } from './BorderConverter';
import type { RawCell, RawPageSetup, RawSheetData } from './ExcelTypes';

/** シートのパース結果 */
export type ParsedSheet = {
  readonly paper: PaperDefinition;
  readonly boxes: readonly BoxDefinition[];
  readonly lines: readonly LineDefinition[];
};

/** Excel paperSize 番号 → PaperSize マッピング */
const PAPER_SIZE_MAP: Record<number, PaperSize> = {
  8: 'A3',
  9: 'A4',
  11: 'A5',
};

/** デフォルト列幅（文字数単位、Excel のデフォルト: 8.43） */
const DEFAULT_COLUMN_WIDTH = 8.43;

/** デフォルト行高（pt、Excel のデフォルト: 15） */
const DEFAULT_ROW_HEIGHT = 15;

/**
 * RawSheetData をパースして Box[] + Line[] に変換する。
 *
 * 処理フロー:
 * 1. pageSetup + margins → PaperDefinition
 * 2. columnWidths → mm 累積和で各列の x 座標
 * 3. rowHeights → mm 累積和で各行の y 座標
 * 4. cells → BoxDefinition[]（マージセルは master のみ）
 * 5. effectiveScale で全座標にスケーリング適用
 */
export function parseSheet(raw: RawSheetData): ParsedSheet {
  resetBoxIdCounter();
  resetLineIdCounter();

  const filtered = applyPrintArea(raw);
  const paper = buildPaperDefinition(filtered.pageSetup, filtered.margins);
  const columnXPositions = buildColumnPositions(filtered.columnWidths);
  const rowYPositions = buildRowPositions(filtered.rowHeights);
  const mergeMap = buildMergeMap(filtered.merges);

  const effectiveScale = calculateEffectiveScale(
    paper.scaling,
    paper.printableArea,
    computeContentSize(columnXPositions, rowYPositions),
  );

  const boxes = buildBoxes(
    filtered.cells,
    columnXPositions,
    rowYPositions,
    mergeMap,
    effectiveScale,
  );

  const lines = extractLines(boxes);

  return {
    paper,
    boxes,
    lines,
  };
}

/** 印刷領域の範囲情報 */
export type PrintAreaRange = {
  readonly startCol: number;
  readonly startRow: number;
  readonly endCol: number;
  readonly endRow: number;
};

/**
 * printArea 文字列をパースして範囲情報を返す。
 * ExcelJS の printArea は 'A1:D20' や 'Sheet1!A1:D20' の形式。
 */
export function parsePrintArea(printArea?: string): PrintAreaRange | null {
  if (!printArea) return null;

  // シート名プレフィックスを除去（例: "'Sheet1'!A1:D20" → "A1:D20"）
  const withoutSheet = printArea.includes('!')
    ? printArea.slice(printArea.lastIndexOf('!') + 1)
    : printArea;

  // $ 記号を除去（絶対参照: $A$1:$D$20 → A1:D20）
  const cleaned = withoutSheet.replace(/\$/g, '');

  return parseCellRange(cleaned);
}

/**
 * printArea が設定されている場合、RawSheetData をフィルタリング・リマップする。
 * - セルを印刷領域内のみに絞り込む
 * - 列幅・行高を印刷領域の範囲に切り出す
 * - セルの row/col を印刷領域の起点からの相対値にリマップする
 * - 結合範囲も同様にリマップする
 */
export function applyPrintArea(raw: RawSheetData): RawSheetData {
  const range = parsePrintArea(raw.pageSetup.printArea);
  if (!range) return raw;

  const { startCol, startRow, endCol, endRow } = range;

  // 列幅を印刷領域分だけ切り出し（0-indexed: startCol-1 ~ endCol-1）
  const slicedColumnWidths = raw.columnWidths.slice(startCol - 1, endCol);

  // 行高を印刷領域分だけ切り出し（0-indexed: startRow-1 ~ endRow-1）
  const slicedRowHeights = raw.rowHeights.slice(startRow - 1, endRow);

  // セルをフィルタリング＋リマップ
  const filteredCells: RawCell[] = [];
  for (const cell of raw.cells) {
    if (cell.row >= startRow && cell.row <= endRow && cell.col >= startCol && cell.col <= endCol) {
      filteredCells.push({
        ...cell,
        address: columnNumberToLetter(cell.col - startCol + 1) + (cell.row - startRow + 1),
        row: cell.row - startRow + 1,
        col: cell.col - startCol + 1,
      });
    }
  }

  // 結合範囲をリマップ（印刷領域と交差するもののみ）
  const remappedMerges: string[] = [];
  for (const merge of raw.merges) {
    const parsed = parseCellRange(merge);
    if (!parsed) continue;

    // 印刷領域と交差しない結合はスキップ
    if (
      parsed.endCol < startCol ||
      parsed.startCol > endCol ||
      parsed.endRow < startRow ||
      parsed.startRow > endRow
    ) {
      continue;
    }

    // 印刷領域内にクリップしてリマップ
    const clippedStartCol = Math.max(parsed.startCol, startCol) - startCol + 1;
    const clippedStartRow = Math.max(parsed.startRow, startRow) - startRow + 1;
    const clippedEndCol = Math.min(parsed.endCol, endCol) - startCol + 1;
    const clippedEndRow = Math.min(parsed.endRow, endRow) - startRow + 1;

    const remapped =
      `${columnNumberToLetter(clippedStartCol)}${clippedStartRow}:` +
      `${columnNumberToLetter(clippedEndCol)}${clippedEndRow}`;
    remappedMerges.push(remapped);
  }

  // 行改ページをリマップ（印刷領域内のものだけ、相対行番号に変換）
  const remappedRowBreaks: number[] = [];
  for (const breakRow of raw.rowBreaks) {
    if (breakRow >= startRow && breakRow < endRow) {
      remappedRowBreaks.push(breakRow - startRow + 1);
    }
  }

  return {
    ...raw,
    columnWidths: slicedColumnWidths,
    rowHeights: slicedRowHeights,
    cells: filteredCells,
    merges: remappedMerges,
    rowBreaks: remappedRowBreaks,
  };
}

/** pageSetup + margins → PaperDefinition */
function buildPaperDefinition(pageSetup: RawPageSetup, margins: Margins | null): PaperDefinition {
  const paperSize = resolvePaperSize(pageSetup.paperSize);
  const orientation = resolveOrientation(pageSetup.orientation);
  const scaling = resolveScaling(pageSetup);
  const centering = resolveCentering(pageSetup);
  const resolvedMargins = margins ?? DEFAULT_MARGINS;

  const result = createPaperDefinition({
    size: paperSize,
    orientation,
    margins: resolvedMargins,
    scaling,
    centering,
  });

  if (!result.ok) {
    // フォールバック: デフォルト余白で再試行
    const fallback = createPaperDefinition({
      size: paperSize,
      orientation,
      scaling,
      centering,
    });
    if (!fallback.ok) {
      throw new Error(`用紙定義の生成に失敗しました: ${fallback.error}`);
    }
    return fallback.paper;
  }

  return result.paper;
}

/** pageSetup → PaperCentering */
export function resolveCentering(pageSetup: RawPageSetup): PaperCentering {
  return {
    horizontal: pageSetup.horizontalCentered ?? false,
    vertical: pageSetup.verticalCentered ?? false,
  };
}

/** Excel paperSize 番号 → PaperSize（未知は A4） */
export function resolvePaperSize(paperSizeNum?: number): PaperSize {
  if (paperSizeNum === undefined) return 'A4';
  return PAPER_SIZE_MAP[paperSizeNum] ?? 'A4';
}

/** orientation 文字列 → Orientation 型 */
export function resolveOrientation(orientation?: string): Orientation {
  if (orientation === 'landscape') return 'landscape';
  return 'portrait';
}

/** pageSetup → ScalingConfig */
export function resolveScaling(pageSetup: RawPageSetup): ScalingConfig {
  if (pageSetup.fitToPage) {
    return {
      mode: 'fitToPage',
      width: pageSetup.fitToWidth ?? 1,
      height: pageSetup.fitToHeight ?? 1,
    };
  }
  return {
    mode: 'scale',
    percent: pageSetup.scale ?? 100,
  };
}

/** 列幅（文字数単位）→ mm の累積 x 座標配列 */
export function buildColumnPositions(columnWidths: readonly number[]): readonly number[] {
  const positions: number[] = [0];
  for (let i = 0; i < columnWidths.length; i++) {
    const raw = columnWidths[i] ?? DEFAULT_COLUMN_WIDTH;
    const width = raw >= 0 ? raw : DEFAULT_COLUMN_WIDTH;
    const prev = positions[i] ?? 0;
    positions.push(prev + excelColumnWidthToMm(width));
  }
  return positions;
}

/** 行高（pt）→ mm の累積 y 座標配列 */
export function buildRowPositions(rowHeights: readonly number[]): readonly number[] {
  const positions: number[] = [0];
  for (let i = 0; i < rowHeights.length; i++) {
    const raw = rowHeights[i] ?? DEFAULT_ROW_HEIGHT;
    const height = raw >= 0 ? raw : DEFAULT_ROW_HEIGHT;
    const prev = positions[i] ?? 0;
    positions.push(prev + ptToMm(height));
  }
  return positions;
}

/** コンテンツ全体のサイズ（mm）を算出する */
function computeContentSize(
  columnPositions: readonly number[],
  rowPositions: readonly number[],
): { width: number; height: number } {
  return {
    width: columnPositions[columnPositions.length - 1] ?? 0,
    height: rowPositions[rowPositions.length - 1] ?? 0,
  };
}

/** 結合範囲文字列 → マスターセルアドレスのマップ */
type MergeInfo = {
  readonly startRow: number;
  readonly startCol: number;
  readonly endRow: number;
  readonly endCol: number;
};

export function buildMergeMap(merges: readonly string[]): ReadonlyMap<string, MergeInfo> {
  const map = new Map<string, MergeInfo>();

  for (const range of merges) {
    const parsed = parseCellRange(range);
    if (parsed) {
      const masterAddress = columnNumberToLetter(parsed.startCol) + parsed.startRow;
      map.set(masterAddress, parsed);
    }
  }

  return map;
}

/** 'A1:C2' のような範囲文字列をパースする */
export function parseCellRange(range: string): MergeInfo | null {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return null;

  const [, startColStr, startRowStr, endColStr, endRowStr] = match;
  if (!startColStr || !startRowStr || !endColStr || !endRowStr) return null;

  return {
    startCol: letterToColumnNumber(startColStr),
    startRow: Number(startRowStr),
    endCol: letterToColumnNumber(endColStr),
    endRow: Number(endRowStr),
  };
}

/** 列文字 → 列番号（A=1, B=2, ..., Z=26, AA=27） */
export function letterToColumnNumber(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result;
}

/** 列番号 → 列文字（1=A, 2=B, ..., 26=Z, 27=AA） */
export function columnNumberToLetter(col: number): string {
  let result = '';
  let n = col;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/** セル配列から Box[] を生成する */
function buildBoxes(
  cells: readonly RawCell[],
  columnPositions: readonly number[],
  rowPositions: readonly number[],
  mergeMap: ReadonlyMap<string, MergeInfo>,
  effectiveScale: number,
): BoxDefinition[] {
  const boxes: BoxDefinition[] = [];
  const processedMergeSlaves = new Set<string>();
  const cellMap = buildCellMap(cells);

  // マージされたスレーブセルのアドレスを収集
  for (const [, merge] of mergeMap) {
    for (let r = merge.startRow; r <= merge.endRow; r++) {
      for (let c = merge.startCol; c <= merge.endCol; c++) {
        const addr = columnNumberToLetter(c) + r;
        const masterAddr = columnNumberToLetter(merge.startCol) + merge.startRow;
        if (addr !== masterAddr) {
          processedMergeSlaves.add(addr);
        }
      }
    }
  }

  for (const cell of cells) {
    // スレーブセルはスキップ
    if (cell.isMerged && processedMergeSlaves.has(cell.address)) {
      continue;
    }

    const merge = mergeMap.get(cell.address);
    const rect = computeCellRect(cell, merge, columnPositions, rowPositions, effectiveScale);
    if (!rect || rect.size.width === 0 || rect.size.height === 0) continue;

    const border = merge ? collectMergeBorder(merge, cellMap) : convertBorder(cell.style.border);

    const box = createBox({
      id: generateBoxId(),
      rect,
      content: cell.value,
      border,
      font: cell.style.font
        ? {
            name: cell.style.font.name,
            sizePt: cell.style.font.size
              ? applyScale(cell.style.font.size, effectiveScale)
              : undefined,
            bold: cell.style.font.bold,
            italic: cell.style.font.italic,
            color: cell.style.font.color,
          }
        : undefined,
      fill: cell.style.fill?.color ? { color: cell.style.fill.color } : undefined,
      alignment: cell.style.alignment
        ? {
            horizontal: resolveHorizontalAlignment(cell.style.alignment.horizontal),
            vertical: resolveVerticalAlignment(cell.style.alignment.vertical),
            wrapText: cell.style.alignment.wrapText,
          }
        : undefined,
    });

    boxes.push(box);
  }

  return boxes;
}

/** セルの矩形を算出する（mm、スケーリング適用済み） */
function computeCellRect(
  cell: RawCell,
  merge: MergeInfo | undefined,
  columnPositions: readonly number[],
  rowPositions: readonly number[],
  effectiveScale: number,
): { position: { x: number; y: number }; size: { width: number; height: number } } | null {
  const startCol = merge ? merge.startCol : cell.col;
  const startRow = merge ? merge.startRow : cell.row;
  const endCol = merge ? merge.endCol + 1 : cell.col + 1;
  const endRow = merge ? merge.endRow + 1 : cell.row + 1;

  // 座標配列の範囲外チェック
  if (
    startCol < 1 ||
    startCol >= columnPositions.length ||
    endCol > columnPositions.length ||
    startRow < 1 ||
    startRow >= rowPositions.length ||
    endRow > rowPositions.length
  ) {
    return null;
  }

  const colStart = columnPositions[startCol - 1] ?? 0;
  const colEnd = columnPositions[endCol - 1] ?? 0;
  const rowStart = rowPositions[startRow - 1] ?? 0;
  const rowEnd = rowPositions[endRow - 1] ?? 0;

  const x = applyScale(colStart, effectiveScale);
  const y = applyScale(rowStart, effectiveScale);
  const width = applyScale(colEnd - colStart, effectiveScale);
  const height = applyScale(rowEnd - rowStart, effectiveScale);

  return {
    position: { x, y },
    size: { width, height },
  };
}

/** 水平配置の解決 */
function resolveHorizontalAlignment(value?: string): HorizontalAlignment | undefined {
  if (value === 'center' || value === 'right' || value === 'left') return value;
  return undefined;
}

/** 垂直配置の解決（OOXML は "center" を使用、BoxTypes は "middle" を定義） */
function resolveVerticalAlignment(value?: string): VerticalAlignment | undefined {
  if (value === 'center') return 'middle';
  if (value === 'middle' || value === 'bottom' || value === 'top') return value;
  return undefined;
}
