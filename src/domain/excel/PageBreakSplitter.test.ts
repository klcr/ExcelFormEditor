import { describe, expect, it } from 'vitest';
import type { RawCell, RawSheetData } from './ExcelTypes';
import { splitByRowBreaks } from './PageBreakSplitter';

function createSheet(overrides?: Partial<RawSheetData>): RawSheetData {
  return {
    name: 'テスト',
    pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100 },
    margins: { top: 1.0, bottom: 1.0, left: 0.75, right: 0.75, header: 0.3, footer: 0.3 },
    columnWidths: [8.43, 8.43],
    rowHeights: [15, 15, 15, 15],
    cells: [],
    merges: [],
    rowBreaks: [],
    ...overrides,
  };
}

function createCell(row: number, col: number, value: string): RawCell {
  const colLetter = col === 1 ? 'A' : col === 2 ? 'B' : 'C';
  return {
    address: `${colLetter}${row}`,
    row,
    col,
    value,
    style: {},
    isMerged: false,
  };
}

describe('splitByRowBreaks', () => {
  it('ブレークなしの場合、元データをそのまま返す', () => {
    const sheet = createSheet();
    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sheet);
  });

  it('空の rowBreaks 配列の場合、元データをそのまま返す', () => {
    const sheet = createSheet({ rowBreaks: [] });
    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sheet);
  });

  it('単一ブレークで 2 ページに分割する', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30, 40],
      rowBreaks: [2],
      cells: [
        createCell(1, 1, 'page1-A'),
        createCell(2, 1, 'page1-B'),
        createCell(3, 1, 'page2-A'),
        createCell(4, 1, 'page2-B'),
      ],
    });

    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(2);

    // ページ 1: 行 1-2
    expect(result[0]?.rowHeights).toEqual([10, 20]);
    expect(result[0]?.cells).toHaveLength(2);
    expect(result[0]?.cells[0]?.value).toBe('page1-A');
    expect(result[0]?.cells[0]?.row).toBe(1);
    expect(result[0]?.cells[1]?.value).toBe('page1-B');
    expect(result[0]?.cells[1]?.row).toBe(2);

    // ページ 2: 行 3-4（リマップで 1-2 に）
    expect(result[1]?.rowHeights).toEqual([30, 40]);
    expect(result[1]?.cells).toHaveLength(2);
    expect(result[1]?.cells[0]?.value).toBe('page2-A');
    expect(result[1]?.cells[0]?.row).toBe(1);
    expect(result[1]?.cells[0]?.address).toBe('A1');
    expect(result[1]?.cells[1]?.value).toBe('page2-B');
    expect(result[1]?.cells[1]?.row).toBe(2);
    expect(result[1]?.cells[1]?.address).toBe('A2');
  });

  it('複数ブレークで正しいページ数に分割する', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30, 40, 50, 60],
      rowBreaks: [2, 4],
      cells: [],
    });

    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(3);
    expect(result[0]?.rowHeights).toEqual([10, 20]);
    expect(result[1]?.rowHeights).toEqual([30, 40]);
    expect(result[2]?.rowHeights).toEqual([50, 60]);
  });

  it('データ範囲外のブレークは無視する', () => {
    const sheet = createSheet({
      rowHeights: [10, 20],
      rowBreaks: [0, 5, 100],
    });

    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sheet);
  });

  it('重複ブレークを正しく処理する', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30, 40],
      rowBreaks: [2, 2, 2],
    });

    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(2);
    expect(result[0]?.rowHeights).toEqual([10, 20]);
    expect(result[1]?.rowHeights).toEqual([30, 40]);
  });

  it('マージセルがブレーク境界をまたぐ場合にクリップする', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30, 40],
      rowBreaks: [2],
      merges: ['A1:A4'],
      cells: [createCell(1, 1, '結合')],
    });

    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(2);
    // ページ 1: A1:A4 → A1:A2 にクリップ
    expect(result[0]?.merges).toEqual(['A1:A2']);
    // ページ 2: A1:A4 → A3:A4 → リマップで A1:A2
    expect(result[1]?.merges).toEqual(['A1:A2']);
  });

  it('セルのアドレスが各サブページでリマップされる', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30],
      rowBreaks: [1],
      cells: [createCell(1, 2, 'B1'), createCell(3, 2, 'B3')],
    });

    const result = splitByRowBreaks(sheet);

    expect(result[0]?.cells[0]?.address).toBe('B1');
    expect(result[0]?.cells[0]?.row).toBe(1);
    expect(result[1]?.cells[0]?.address).toBe('B2');
    expect(result[1]?.cells[0]?.row).toBe(2);
  });

  it('fitToPage で fitToHeight を 1 に正規化する', () => {
    const sheet = createSheet({
      pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 3 },
      rowHeights: [10, 20, 30],
      rowBreaks: [1],
    });

    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(2);
    expect(result[0]?.pageSetup.fitToHeight).toBe(1);
    expect(result[1]?.pageSetup.fitToHeight).toBe(1);
  });

  it('fitToPage で fitToHeight が既に 1 の場合はそのまま', () => {
    const sheet = createSheet({
      pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
      rowHeights: [10, 20, 30],
      rowBreaks: [1],
    });

    const result = splitByRowBreaks(sheet);

    expect(result[0]?.pageSetup.fitToHeight).toBe(1);
  });

  it('columnWidths は全サブページで共通', () => {
    const sheet = createSheet({
      columnWidths: [8.43, 12.5],
      rowHeights: [10, 20, 30],
      rowBreaks: [1],
    });

    const result = splitByRowBreaks(sheet);

    expect(result[0]?.columnWidths).toEqual([8.43, 12.5]);
    expect(result[1]?.columnWidths).toEqual([8.43, 12.5]);
  });

  it('分割後の rowBreaks はクリアされる', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30],
      rowBreaks: [1],
    });

    const result = splitByRowBreaks(sheet);

    expect(result[0]?.rowBreaks).toEqual([]);
    expect(result[1]?.rowBreaks).toEqual([]);
  });

  it('セルが存在しない行範囲でも正しくスライスする', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30, 40],
      rowBreaks: [2],
      cells: [createCell(1, 1, 'page1のみ')],
    });

    const result = splitByRowBreaks(sheet);

    expect(result).toHaveLength(2);
    expect(result[0]?.cells).toHaveLength(1);
    expect(result[1]?.cells).toHaveLength(0);
  });

  it('最終行にブレークがある場合は空ページを生成しない', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30],
      rowBreaks: [3],
    });

    const result = splitByRowBreaks(sheet);

    // ブレーク行 3 == totalRows なので範囲外として除外
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sheet);
  });

  it('行範囲と交差しないマージはスキップする', () => {
    const sheet = createSheet({
      rowHeights: [10, 20, 30, 40],
      rowBreaks: [2],
      merges: ['A1:B2', 'A3:B4'],
      cells: [],
    });

    const result = splitByRowBreaks(sheet);

    expect(result[0]?.merges).toEqual(['A1:B2']);
    expect(result[1]?.merges).toEqual(['A1:B2']); // A3:B4 → リマップで A1:B2
  });
});
