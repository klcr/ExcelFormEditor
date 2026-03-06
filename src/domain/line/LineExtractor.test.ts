import { createBox, resetBoxIdCounter } from '@domain/box';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetLineIdCounter } from './Line';
import { extractLines } from './LineExtractor';

function makeBox(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  border: {
    top?: { style: string; color: string };
    bottom?: { style: string; color: string };
    left?: { style: string; color: string };
    right?: { style: string; color: string };
  } = {},
) {
  return createBox({
    id,
    rect: { position: { x, y }, size: { width: w, height: h } },
    border: border as Parameters<typeof createBox>[0]['border'],
  });
}

describe('extractLines', () => {
  beforeEach(() => {
    resetBoxIdCounter();
    resetLineIdCounter();
  });

  it('空のボックス配列から空の線分配列を返す', () => {
    expect(extractLines([])).toEqual([]);
  });

  it('罫線なしのボックスから線分を生成しない', () => {
    const boxes = [makeBox('b1', 0, 0, 10, 5)];
    expect(extractLines(boxes)).toEqual([]);
  });

  it('4辺に罫線があるボックスから4本の線分を生成する', () => {
    const boxes = [
      makeBox('b1', 0, 0, 10, 5, {
        top: { style: 'thin', color: '000000' },
        bottom: { style: 'thin', color: '000000' },
        left: { style: 'thin', color: '000000' },
        right: { style: 'thin', color: '000000' },
      }),
    ];
    const lines = extractLines(boxes);
    expect(lines).toHaveLength(4);
  });

  it('一部の辺のみ罫線があるボックスからその辺のみ線分を生成する', () => {
    const boxes = [
      makeBox('b1', 0, 0, 10, 5, {
        top: { style: 'thin', color: '000000' },
        left: { style: 'thin', color: '000000' },
      }),
    ];
    const lines = extractLines(boxes);
    expect(lines).toHaveLength(2);
  });

  it('隣接する2つのボックスの共有辺を重複排除する', () => {
    // boxA の right と boxB の left が同じ座標
    const boxes = [
      makeBox('a', 0, 0, 10, 5, {
        right: { style: 'thin', color: '000000' },
      }),
      makeBox('b', 10, 0, 10, 5, {
        left: { style: 'thin', color: '000000' },
      }),
    ];
    const lines = extractLines(boxes);
    expect(lines).toHaveLength(1);
    // x=10 の縦線
    expect(lines[0]?.start).toEqual({ x: 10, y: 0 });
    expect(lines[0]?.end).toEqual({ x: 10, y: 5 });
  });

  it('共有辺でスタイルが異なる場合、太い方を残す', () => {
    const boxes = [
      makeBox('a', 0, 0, 10, 5, {
        right: { style: 'thin', color: '000000' },
      }),
      makeBox('b', 10, 0, 10, 5, {
        left: { style: 'thick', color: 'FF0000' },
      }),
    ];
    const lines = extractLines(boxes);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.style).toBe('thick');
    expect(lines[0]?.color).toBe('FF0000');
  });

  it('生成された線分に一意な ID が付与される', () => {
    const boxes = [
      makeBox('b1', 0, 0, 10, 5, {
        top: { style: 'thin', color: '000000' },
        bottom: { style: 'thin', color: '000000' },
      }),
    ];
    const lines = extractLines(boxes);
    expect(lines[0]?.id).toBe('line-1');
    expect(lines[1]?.id).toBe('line-2');
  });

  it('上下に隣接するボックスの共有辺を重複排除する', () => {
    const boxes = [
      makeBox('a', 0, 0, 10, 5, {
        bottom: { style: 'medium', color: '000000' },
      }),
      makeBox('b', 0, 5, 10, 5, {
        top: { style: 'medium', color: '000000' },
      }),
    ];
    const lines = extractLines(boxes);
    expect(lines).toHaveLength(1);
    // y=5 の横線
    expect(lines[0]?.start).toEqual({ x: 0, y: 5 });
    expect(lines[0]?.end).toEqual({ x: 10, y: 5 });
  });
});
