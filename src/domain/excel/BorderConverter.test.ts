import { describe, expect, it } from 'vitest';
import {
  buildCellMap,
  collectMergeBorder,
  convertBorder,
  convertBorderEdge,
} from './BorderConverter';
import type { RawCell } from './ExcelTypes';

describe('convertBorderEdge', () => {
  it('undefined を渡すと undefined を返す', () => {
    expect(convertBorderEdge(undefined)).toBeUndefined();
  });

  it('style が undefined の場合 undefined を返す', () => {
    expect(convertBorderEdge({ color: '000000' })).toBeUndefined();
  });

  it('有効なスタイルを変換する', () => {
    const result = convertBorderEdge({ style: 'thin', color: 'FF0000' });
    expect(result).toEqual({ style: 'thin', color: 'FF0000' });
  });

  it('color が undefined の場合デフォルト色 000000 を使う', () => {
    const result = convertBorderEdge({ style: 'medium' });
    expect(result).toEqual({ style: 'medium', color: '000000' });
  });

  it('不正なスタイルは thin にフォールバックする', () => {
    const result = convertBorderEdge({ style: 'unknown', color: 'AABBCC' });
    expect(result).toEqual({ style: 'thin', color: 'AABBCC' });
  });

  it.each(['thin', 'medium', 'thick', 'dotted', 'dashed', 'double', 'hair'] as const)(
    '%s スタイルを正しく変換する',
    (style) => {
      const result = convertBorderEdge({ style, color: '000000' });
      expect(result?.style).toBe(style);
    },
  );
});

describe('convertBorder', () => {
  it('undefined を渡すと undefined を返す', () => {
    expect(convertBorder(undefined)).toBeUndefined();
  });

  it('全辺が定義されている場合すべて変換する', () => {
    const result = convertBorder({
      top: { style: 'thin', color: '000000' },
      bottom: { style: 'medium', color: '111111' },
      left: { style: 'thick', color: '222222' },
      right: { style: 'dashed', color: '333333' },
    });
    expect(result).toEqual({
      top: { style: 'thin', color: '000000' },
      bottom: { style: 'medium', color: '111111' },
      left: { style: 'thick', color: '222222' },
      right: { style: 'dashed', color: '333333' },
    });
  });

  it('一部の辺のみ定義されている場合、残りは undefined', () => {
    const result = convertBorder({
      top: { style: 'thin', color: '000000' },
    });
    expect(result).toEqual({
      top: { style: 'thin', color: '000000' },
      bottom: undefined,
      left: undefined,
      right: undefined,
    });
  });

  it('全辺が style なしの場合 undefined を返す', () => {
    const result = convertBorder({
      top: { color: '000000' },
      bottom: { color: '000000' },
    });
    expect(result).toBeUndefined();
  });
});

describe('buildCellMap', () => {
  it('空配列から空のマップを返す', () => {
    const map = buildCellMap([]);
    expect(map.size).toBe(0);
  });

  it('セルのアドレスをキーとしたマップを構築する', () => {
    const cells: RawCell[] = [
      { address: 'A1', row: 1, col: 1, value: 'a', style: {}, isMerged: false },
      { address: 'B2', row: 2, col: 2, value: 'b', style: {}, isMerged: false },
    ];
    const map = buildCellMap(cells);
    expect(map.size).toBe(2);
    expect(map.get('A1')?.value).toBe('a');
    expect(map.get('B2')?.value).toBe('b');
  });
});

describe('collectMergeBorder', () => {
  it('外周セルに罫線がない場合 undefined を返す', () => {
    const cells: RawCell[] = [
      { address: 'A1', row: 1, col: 1, value: '', style: {}, isMerged: true },
    ];
    const cellMap = buildCellMap(cells);
    const result = collectMergeBorder({ startRow: 1, startCol: 1, endRow: 2, endCol: 2 }, cellMap);
    expect(result).toBeUndefined();
  });

  it('外周セルの罫線を正しく収集する', () => {
    const cells: RawCell[] = [
      {
        address: 'A1',
        row: 1,
        col: 1,
        value: '',
        style: {
          border: {
            top: { style: 'thin', color: '000000' },
            left: { style: 'medium', color: '111111' },
          },
        },
        isMerged: true,
      },
      {
        address: 'B2',
        row: 2,
        col: 2,
        value: '',
        style: {
          border: {
            bottom: { style: 'thick', color: '222222' },
            right: { style: 'dashed', color: '333333' },
          },
        },
        isMerged: true,
      },
    ];
    const cellMap = buildCellMap(cells);
    const result = collectMergeBorder({ startRow: 1, startCol: 1, endRow: 2, endCol: 2 }, cellMap);
    expect(result).toEqual({
      top: { style: 'thin', color: '000000' },
      bottom: { style: 'thick', color: '222222' },
      left: { style: 'medium', color: '111111' },
      right: { style: 'dashed', color: '333333' },
    });
  });
});
