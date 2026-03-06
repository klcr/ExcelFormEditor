import { beforeEach, describe, expect, it } from 'vitest';
import { createBox, resetBoxIdCounter } from './Box';
import {
  findNearestSnapPoints,
  moveBox,
  resizeBox,
  snapToGrid,
  splitBoxHorizontal,
  splitBoxVertical,
} from './BoxOperations';
import type { BoxDefinition } from './BoxTypes';

/** テスト用のボックスを作成するヘルパー */
function makeBox(
  overrides: Partial<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    content: string;
  }> = {},
): BoxDefinition {
  return createBox({
    id: overrides.id ?? 'test-box',
    rect: {
      position: { x: overrides.x ?? 10, y: overrides.y ?? 20 },
      size: { width: overrides.w ?? 100, height: overrides.h ?? 50 },
    },
    content: overrides.content ?? 'テスト',
    border: {
      top: { style: 'thin', color: '000000' },
      bottom: { style: 'medium', color: 'FF0000' },
      left: { style: 'thin', color: '000000' },
      right: { style: 'thin', color: '000000' },
    },
    fill: { color: 'FFFFFF' },
  });
}

describe('moveBox', () => {
  it('正のデルタで移動する', () => {
    const box = makeBox();
    const moved = moveBox(box, { x: 5, y: 10 });

    expect(moved.rect.position).toEqual({ x: 15, y: 30 });
    expect(moved.rect.size).toEqual(box.rect.size);
  });

  it('負のデルタで移動する', () => {
    const box = makeBox();
    const moved = moveBox(box, { x: -3, y: -7 });

    expect(moved.rect.position).toEqual({ x: 7, y: 13 });
  });

  it('ゼロデルタでは位置が変わらない', () => {
    const box = makeBox();
    const moved = moveBox(box, { x: 0, y: 0 });

    expect(moved.rect.position).toEqual(box.rect.position);
  });

  it('元のボックスを変更しない（イミュータブル）', () => {
    const box = makeBox();
    const originalPosition = { ...box.rect.position };
    moveBox(box, { x: 50, y: 50 });

    expect(box.rect.position).toEqual(originalPosition);
  });

  it('content, border, font 等は保持される', () => {
    const box = makeBox();
    const moved = moveBox(box, { x: 1, y: 1 });

    expect(moved.id).toBe(box.id);
    expect(moved.content).toBe(box.content);
    expect(moved.border).toEqual(box.border);
    expect(moved.font).toEqual(box.font);
    expect(moved.fill).toEqual(box.fill);
    expect(moved.alignment).toEqual(box.alignment);
  });
});

describe('resizeBox', () => {
  it('新しいサイズにリサイズする', () => {
    const box = makeBox();
    const resized = resizeBox(box, { width: 200, height: 80 });

    expect(resized.rect.size).toEqual({ width: 200, height: 80 });
    expect(resized.rect.position).toEqual(box.rect.position);
  });

  it('width が 0 以下の場合はエラーを投げる', () => {
    const box = makeBox();
    expect(() => resizeBox(box, { width: 0, height: 50 })).toThrow(
      'width and height must be greater than 0',
    );
    expect(() => resizeBox(box, { width: -1, height: 50 })).toThrow(
      'width and height must be greater than 0',
    );
  });

  it('height が 0 以下の場合はエラーを投げる', () => {
    const box = makeBox();
    expect(() => resizeBox(box, { width: 50, height: 0 })).toThrow(
      'width and height must be greater than 0',
    );
    expect(() => resizeBox(box, { width: 50, height: -10 })).toThrow(
      'width and height must be greater than 0',
    );
  });

  it('小数値のサイズを受け付ける', () => {
    const box = makeBox();
    const resized = resizeBox(box, { width: 0.5, height: 0.1 });

    expect(resized.rect.size).toEqual({ width: 0.5, height: 0.1 });
  });

  it('元のボックスを変更しない（イミュータブル）', () => {
    const box = makeBox();
    const originalSize = { ...box.rect.size };
    resizeBox(box, { width: 200, height: 80 });

    expect(box.rect.size).toEqual(originalSize);
  });
});

describe('splitBoxHorizontal', () => {
  beforeEach(() => {
    resetBoxIdCounter();
  });

  it('ボックスを上下に分割する', () => {
    const box = makeBox({ x: 10, y: 20, w: 100, h: 50 });
    const [top, bottom] = splitBoxHorizontal(box, 20);

    // 上部ボックス
    expect(top.rect.position).toEqual({ x: 10, y: 20 });
    expect(top.rect.size).toEqual({ width: 100, height: 20 });
    expect(top.content).toBe('テスト');

    // 下部ボックス
    expect(bottom.rect.position).toEqual({ x: 10, y: 40 });
    expect(bottom.rect.size).toEqual({ width: 100, height: 30 });
    expect(bottom.content).toBe('');
  });

  it('上部ボックスは元の top ボーダーを、下部ボックスは元の bottom ボーダーを保持する', () => {
    const box = makeBox();
    const [top, bottom] = splitBoxHorizontal(box, 25);

    expect(top.border.top).toEqual({ style: 'thin', color: '000000' });
    expect(top.border.bottom).toBeUndefined();
    expect(bottom.border.top).toBeUndefined();
    expect(bottom.border.bottom).toEqual({ style: 'medium', color: 'FF0000' });
  });

  it('左右のボーダーは両方のボックスに保持される', () => {
    const box = makeBox();
    const [top, bottom] = splitBoxHorizontal(box, 25);

    expect(top.border.left).toEqual({ style: 'thin', color: '000000' });
    expect(top.border.right).toEqual({ style: 'thin', color: '000000' });
    expect(bottom.border.left).toEqual({ style: 'thin', color: '000000' });
    expect(bottom.border.right).toEqual({ style: 'thin', color: '000000' });
  });

  it('splitY が 0 以下の場合はエラーを投げる', () => {
    const box = makeBox({ h: 50 });
    expect(() => splitBoxHorizontal(box, 0)).toThrow('splitY must be between 0 and 50 exclusive');
    expect(() => splitBoxHorizontal(box, -5)).toThrow('splitY must be between 0 and 50 exclusive');
  });

  it('splitY がボックスの高さ以上の場合はエラーを投げる', () => {
    const box = makeBox({ h: 50 });
    expect(() => splitBoxHorizontal(box, 50)).toThrow('splitY must be between 0 and 50 exclusive');
    expect(() => splitBoxHorizontal(box, 60)).toThrow('splitY must be between 0 and 50 exclusive');
  });

  it('fill とフォントが両方のボックスに引き継がれる', () => {
    const box = makeBox();
    const [top, bottom] = splitBoxHorizontal(box, 25);

    expect(top.fill).toEqual({ color: 'FFFFFF' });
    expect(bottom.fill).toEqual({ color: 'FFFFFF' });
    expect(top.font).toEqual(box.font);
    expect(bottom.font).toEqual(box.font);
  });

  it('新しい ID が割り当てられる', () => {
    const box = makeBox();
    const [top, bottom] = splitBoxHorizontal(box, 25);

    expect(top.id).not.toBe(box.id);
    expect(bottom.id).not.toBe(box.id);
    expect(top.id).not.toBe(bottom.id);
  });
});

describe('splitBoxVertical', () => {
  beforeEach(() => {
    resetBoxIdCounter();
  });

  it('ボックスを左右に分割する', () => {
    const box = makeBox({ x: 10, y: 20, w: 100, h: 50 });
    const [left, right] = splitBoxVertical(box, 40);

    // 左側ボックス
    expect(left.rect.position).toEqual({ x: 10, y: 20 });
    expect(left.rect.size).toEqual({ width: 40, height: 50 });
    expect(left.content).toBe('テスト');

    // 右側ボックス
    expect(right.rect.position).toEqual({ x: 50, y: 20 });
    expect(right.rect.size).toEqual({ width: 60, height: 50 });
    expect(right.content).toBe('');
  });

  it('左側ボックスは元の left ボーダーを、右側ボックスは元の right ボーダーを保持する', () => {
    const box = makeBox();
    const [left, right] = splitBoxVertical(box, 50);

    expect(left.border.left).toEqual({ style: 'thin', color: '000000' });
    expect(left.border.right).toBeUndefined();
    expect(right.border.left).toBeUndefined();
    expect(right.border.right).toEqual({ style: 'thin', color: '000000' });
  });

  it('上下のボーダーは両方のボックスに保持される', () => {
    const box = makeBox();
    const [left, right] = splitBoxVertical(box, 50);

    expect(left.border.top).toEqual({ style: 'thin', color: '000000' });
    expect(left.border.bottom).toEqual({ style: 'medium', color: 'FF0000' });
    expect(right.border.top).toEqual({ style: 'thin', color: '000000' });
    expect(right.border.bottom).toEqual({ style: 'medium', color: 'FF0000' });
  });

  it('splitX が 0 以下の場合はエラーを投げる', () => {
    const box = makeBox({ w: 100 });
    expect(() => splitBoxVertical(box, 0)).toThrow('splitX must be between 0 and 100 exclusive');
    expect(() => splitBoxVertical(box, -5)).toThrow('splitX must be between 0 and 100 exclusive');
  });

  it('splitX がボックスの幅以上の場合はエラーを投げる', () => {
    const box = makeBox({ w: 100 });
    expect(() => splitBoxVertical(box, 100)).toThrow('splitX must be between 0 and 100 exclusive');
    expect(() => splitBoxVertical(box, 150)).toThrow('splitX must be between 0 and 100 exclusive');
  });

  it('新しい ID が割り当てられる', () => {
    const box = makeBox();
    const [left, right] = splitBoxVertical(box, 50);

    expect(left.id).not.toBe(box.id);
    expect(right.id).not.toBe(box.id);
    expect(left.id).not.toBe(right.id);
  });
});

describe('snapToGrid', () => {
  it('最寄りのグリッドポイントにスナップする', () => {
    expect(snapToGrid(7, 5)).toBe(5);
    expect(snapToGrid(8, 5)).toBe(10);
    expect(snapToGrid(12, 5)).toBe(10);
    expect(snapToGrid(13, 5)).toBe(15);
  });

  it('正確にグリッドポイント上の値はそのまま返す', () => {
    expect(snapToGrid(10, 5)).toBe(10);
    expect(snapToGrid(0, 5)).toBe(0);
    expect(snapToGrid(25, 5)).toBe(25);
  });

  it('中間値は切り上げる（Math.round の挙動）', () => {
    expect(snapToGrid(2.5, 5)).toBe(5);
    expect(snapToGrid(7.5, 5)).toBe(10);
  });

  it('負の値もスナップする', () => {
    expect(snapToGrid(-7, 5)).toBe(-5);
    expect(snapToGrid(-8, 5)).toBe(-10);
  });

  it('小数のグリッドサイズもサポートする', () => {
    expect(snapToGrid(1.3, 0.5)).toBe(1.5);
    expect(snapToGrid(1.1, 0.5)).toBe(1);
  });

  it('gridSize が 0 以下の場合はエラーを投げる', () => {
    expect(() => snapToGrid(10, 0)).toThrow('gridSize must be greater than 0');
    expect(() => snapToGrid(10, -1)).toThrow('gridSize must be greater than 0');
  });
});

describe('findNearestSnapPoints', () => {
  it('threshold 以内のエッジ座標をスナップ候補として返す', () => {
    const box = makeBox({ id: 'target', x: 10, y: 10, w: 50, h: 30 });
    const other = makeBox({ id: 'other', x: 60, y: 10, w: 40, h: 20 });

    // target: left=10, right=60, top=10, bottom=40
    // other:  left=60, right=100, top=10, bottom=30
    const result = findNearestSnapPoints(box, [other], 1);

    // x: target.right(60) == other.left(60) → 60
    expect(result.x).toContain(60);
    // y: target.top(10) == other.top(10) → 10
    expect(result.y).toContain(10);
  });

  it('threshold を超えるボックスは無視する', () => {
    const box = makeBox({ id: 'target', x: 0, y: 0, w: 10, h: 10 });
    const far = makeBox({ id: 'far', x: 100, y: 100, w: 10, h: 10 });

    const result = findNearestSnapPoints(box, [far], 5);

    expect(result.x).toEqual([]);
    expect(result.y).toEqual([]);
  });

  it('同じ ID のボックスはスキップする', () => {
    const box = makeBox({ id: 'same', x: 10, y: 10, w: 50, h: 30 });
    const same = makeBox({ id: 'same', x: 10, y: 10, w: 50, h: 30 });

    const result = findNearestSnapPoints(box, [same], 100);

    expect(result.x).toEqual([]);
    expect(result.y).toEqual([]);
  });

  it('複数のボックスからスナップ候補を集める', () => {
    const box = makeBox({ id: 'target', x: 50, y: 50, w: 20, h: 20 });
    // target: left=50, right=70, top=50, bottom=70
    const a = makeBox({ id: 'a', x: 10, y: 49, w: 40, h: 20 });
    // a: left=10, right=50, top=49, bottom=69
    const b = makeBox({ id: 'b', x: 71, y: 50, w: 30, h: 20 });
    // b: left=71, right=101, top=50, bottom=70

    const result = findNearestSnapPoints(box, [a, b], 2);

    // x: target.left(50)==a.right(50), b.left(71) close to target.right(70)
    expect(result.x).toContain(50);
    expect(result.x).toContain(71);
    // y: a.top(49) close to target.top(50), b.top(50)==target.top(50), b.bottom(70)==target.bottom(70)
    expect(result.y).toContain(49);
    expect(result.y).toContain(50);
    expect(result.y).toContain(70);
  });

  it('空の others 配列では空の結果を返す', () => {
    const box = makeBox({ id: 'target' });
    const result = findNearestSnapPoints(box, [], 10);

    expect(result.x).toEqual([]);
    expect(result.y).toEqual([]);
  });

  it('結果はソート済みで重複なし', () => {
    const box = makeBox({ id: 'target', x: 10, y: 10, w: 50, h: 30 });
    // target: left=10, right=60, top=10, bottom=40
    const a = makeBox({ id: 'a', x: 60, y: 10, w: 10, h: 10 });
    // a: left=60, right=70, top=10, bottom=20
    const b = makeBox({ id: 'b', x: 60, y: 30, w: 10, h: 10 });
    // b: left=60, right=70, top=30, bottom=40
    // Both a and b have left=60 matching target.right=60

    const result = findNearestSnapPoints(box, [a, b], 1);

    // x should contain 60 only once
    expect(result.x.filter((v) => v === 60).length).toBe(1);
    // results should be sorted
    for (let i = 1; i < result.x.length; i++) {
      expect(result.x[i]).toBeGreaterThanOrEqual(result.x[i - 1]);
    }
    for (let i = 1; i < result.y.length; i++) {
      expect(result.y[i]).toBeGreaterThanOrEqual(result.y[i - 1]);
    }
  });
});
