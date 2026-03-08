import { describe, expect, it } from 'vitest';
import { createBox } from './Box';
import { sortBoxesByPosition } from './BoxSorting';

function makeBox(id: string, x: number, y: number) {
  return createBox({
    id,
    rect: { position: { x, y }, size: { width: 20, height: 10 } },
  });
}

describe('sortBoxesByPosition', () => {
  it('空配列はそのまま返す', () => {
    expect(sortBoxesByPosition([])).toEqual([]);
  });

  it('単一ボックスはそのまま返す', () => {
    const box = makeBox('a', 10, 10);
    expect(sortBoxesByPosition([box])).toEqual([box]);
  });

  it('異なる行のボックスを上→下でソートする', () => {
    const bottom = makeBox('bottom', 10, 50);
    const top = makeBox('top', 10, 10);
    const middle = makeBox('middle', 10, 30);
    const result = sortBoxesByPosition([bottom, top, middle]);
    expect(result.map((b) => b.id)).toEqual(['top', 'middle', 'bottom']);
  });

  it('同一行のボックスを左→右でソートする', () => {
    const right = makeBox('right', 80, 10);
    const left = makeBox('left', 10, 10);
    const center = makeBox('center', 40, 10);
    const result = sortBoxesByPosition([right, left, center]);
    expect(result.map((b) => b.id)).toEqual(['left', 'center', 'right']);
  });

  it('y座標が2mm以内のボックスは同一行とみなす', () => {
    const a = makeBox('a', 50, 10);
    const b = makeBox('b', 10, 11.5); // y差 1.5mm → 同一行
    const result = sortBoxesByPosition([a, b]);
    expect(result.map((box) => box.id)).toEqual(['b', 'a']);
  });

  it('y座標が2mmを超えるボックスは別行とみなす', () => {
    const a = makeBox('a', 50, 10);
    const b = makeBox('b', 10, 12.5); // y差 2.5mm → 別行
    const result = sortBoxesByPosition([a, b]);
    expect(result.map((box) => box.id)).toEqual(['a', 'b']);
  });

  it('複数行・複数列のボックスを読み順でソートする', () => {
    const boxes = [
      makeBox('r2c2', 60, 30),
      makeBox('r1c1', 10, 10),
      makeBox('r2c1', 10, 30),
      makeBox('r1c2', 60, 10),
    ];
    const result = sortBoxesByPosition(boxes);
    expect(result.map((b) => b.id)).toEqual(['r1c1', 'r1c2', 'r2c1', 'r2c2']);
  });

  it('元の配列を変更しない', () => {
    const boxes = [makeBox('b', 50, 10), makeBox('a', 10, 10)];
    const original = [...boxes];
    sortBoxesByPosition(boxes);
    expect(boxes).toEqual(original);
  });
});
