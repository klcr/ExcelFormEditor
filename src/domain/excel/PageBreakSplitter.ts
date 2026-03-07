import { columnNumberToLetter, parseCellRange } from './ExcelParser';
import type { RawCell, RawSheetData } from './ExcelTypes';

/**
 * 行改ページ（rowBreaks）に基づいて RawSheetData を複数のサブページに分割する。
 * ブレークがない場合は元データをそのまま 1 要素の配列で返す。
 */
export function splitByRowBreaks(raw: RawSheetData): readonly RawSheetData[] {
  const totalRows = raw.rowHeights.length;
  if (totalRows === 0) return [raw];

  // ブレーク行をソート・重複除去・データ範囲内のみに絞る
  const breaks = normalizeBreaks(raw.rowBreaks, totalRows);
  if (breaks.length === 0) return [raw];

  // 行範囲を算出: [1, break1], [break1+1, break2], ..., [breakN+1, lastRow]
  const ranges = buildRowRanges(breaks, totalRows);

  return ranges.map((range) => sliceByRowRange(raw, range.startRow, range.endRow));
}

/** ブレーク行をソート・重複除去・範囲外除去する */
function normalizeBreaks(rowBreaks: readonly number[], totalRows: number): readonly number[] {
  const unique = [...new Set(rowBreaks)]
    .filter((b) => b >= 1 && b < totalRows)
    .sort((a, b) => a - b);
  return unique;
}

/** ブレーク行から行範囲の配列を構築する */
function buildRowRanges(
  breaks: readonly number[],
  totalRows: number,
): readonly { startRow: number; endRow: number }[] {
  const ranges: { startRow: number; endRow: number }[] = [];
  let start = 1;

  for (const breakRow of breaks) {
    ranges.push({ startRow: start, endRow: breakRow });
    start = breakRow + 1;
  }

  // 最後のブレーク以降の残り
  if (start <= totalRows) {
    ranges.push({ startRow: start, endRow: totalRows });
  }

  return ranges;
}

/** 指定した行範囲で RawSheetData をスライスする（applyPrintArea と同様のリマップ） */
function sliceByRowRange(raw: RawSheetData, startRow: number, endRow: number): RawSheetData {
  // 行高をスライス（0-indexed: startRow-1 ~ endRow-1）
  const slicedRowHeights = raw.rowHeights.slice(startRow - 1, endRow);

  // セルをフィルタリング＋行をリマップ
  const filteredCells: RawCell[] = [];
  for (const cell of raw.cells) {
    if (cell.row >= startRow && cell.row <= endRow) {
      const newRow = cell.row - startRow + 1;
      filteredCells.push({
        ...cell,
        address: columnNumberToLetter(cell.col) + newRow,
        row: newRow,
      });
    }
  }

  // マージ範囲をクリップ＋リマップ
  const remappedMerges: string[] = [];
  for (const merge of raw.merges) {
    const parsed = parseCellRange(merge);
    if (!parsed) continue;

    // 行範囲と交差しないマージはスキップ
    if (parsed.endRow < startRow || parsed.startRow > endRow) {
      continue;
    }

    // 行範囲内にクリップしてリマップ
    const clippedStartRow = Math.max(parsed.startRow, startRow) - startRow + 1;
    const clippedEndRow = Math.min(parsed.endRow, endRow) - startRow + 1;

    const remapped =
      `${columnNumberToLetter(parsed.startCol)}${clippedStartRow}:` +
      `${columnNumberToLetter(parsed.endCol)}${clippedEndRow}`;
    remappedMerges.push(remapped);
  }

  // fitToPage の場合、各サブページで fitToHeight: 1 に正規化
  const pageSetup =
    raw.pageSetup.fitToPage && raw.pageSetup.fitToHeight !== 1
      ? { ...raw.pageSetup, fitToHeight: 1 }
      : raw.pageSetup;

  return {
    ...raw,
    pageSetup,
    rowHeights: slicedRowHeights,
    cells: filteredCells,
    merges: remappedMerges,
    rowBreaks: [],
  };
}
