import { beforeEach, describe, expect, it } from 'vitest';
import { createBox, resetBoxIdCounter } from './Box';
import type { BoxDefinition } from './BoxTypes';
import { applySnap, findSnapGuides } from './SnapGuide';

function makeBox(overrides: {
  id?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}): BoxDefinition {
  return createBox({
    id: overrides.id ?? 'test-box',
    rect: {
      position: { x: overrides.x ?? 0, y: overrides.y ?? 0 },
      size: { width: overrides.w ?? 100, height: overrides.h ?? 50 },
    },
  });
}

describe('findSnapGuides', () => {
  beforeEach(() => resetBoxIdCounter());

  it('threshold 以内のエッジを返す', () => {
    const moving = makeBox({ id: 'moving', x: 49, y: 0, w: 50, h: 30 });
    const other = makeBox({ id: 'other', x: 100, y: 0, w: 50, h: 30 });
    const result = findSnapGuides(moving, [other], 2);

    expect(result.x.length).toBeGreaterThan(0);
    expect(result.x.some((p) => p.value === 100 && p.sourceBoxId === 'other')).toBe(true);
  });

  it('threshold 外のエッジは返さない', () => {
    const moving = makeBox({ id: 'moving', x: 0, y: 0, w: 50, h: 30 });
    const other = makeBox({ id: 'other', x: 200, y: 200, w: 50, h: 30 });
    const result = findSnapGuides(moving, [other], 2);

    expect(result.x).toHaveLength(0);
    expect(result.y).toHaveLength(0);
  });

  it('自身のボックスは除外する', () => {
    const box = makeBox({ id: 'self', x: 0, y: 0, w: 50, h: 30 });
    const result = findSnapGuides(box, [box], 100);

    expect(result.x).toHaveLength(0);
    expect(result.y).toHaveLength(0);
  });

  it('sourceBoxId と edge 情報を返す', () => {
    const moving = makeBox({ id: 'moving', x: 50, y: 0, w: 50, h: 30 });
    const other = makeBox({ id: 'other', x: 0, y: 0, w: 50, h: 30 });
    const result = findSnapGuides(moving, [other], 1);

    const matchingPoint = result.x.find((p) => p.value === 50);
    expect(matchingPoint).toBeDefined();
    expect(matchingPoint?.sourceBoxId).toBe('other');
    expect(matchingPoint?.edge).toBe('right');
  });

  it('Y 方向のスナップポイントを返す', () => {
    const moving = makeBox({ id: 'moving', x: 0, y: 49, w: 50, h: 30 });
    const other = makeBox({ id: 'other', x: 0, y: 0, w: 50, h: 50 });
    const result = findSnapGuides(moving, [other], 2);

    expect(result.y.some((p) => p.value === 50 && p.edge === 'bottom')).toBe(true);
  });

  it('重複するスナップポイントを除去する', () => {
    const moving = makeBox({ id: 'moving', x: 100, y: 0, w: 50, h: 30 });
    const other1 = makeBox({ id: 'o1', x: 0, y: 0, w: 100, h: 30 });
    const other2 = makeBox({ id: 'o2', x: 0, y: 30, w: 100, h: 30 });
    const result = findSnapGuides(moving, [other1, other2], 1);

    // both other1 right and other2 right are at x=100, but different sourceBoxId
    const rightEdges = result.x.filter((p) => p.value === 100);
    expect(rightEdges.length).toBe(2); // o1:right, o2:right — different sourceBoxId
  });
});

describe('applySnap', () => {
  beforeEach(() => resetBoxIdCounter());

  it('近傍のガイドに位置を補正する', () => {
    const guides = {
      x: [{ value: 100, sourceBoxId: 'other', edge: 'left' as const }],
      y: [{ value: 50, sourceBoxId: 'other', edge: 'top' as const }],
    };

    const result = applySnap({ x: 99, y: 49 }, { width: 50, height: 30 }, guides, 2);

    expect(result.correctedPosition.x).toBe(100);
    expect(result.correctedPosition.y).toBe(50);
  });

  it('threshold 外のガイドでは補正しない', () => {
    const guides = {
      x: [{ value: 200, sourceBoxId: 'other', edge: 'left' as const }],
      y: [],
    };

    const result = applySnap({ x: 10, y: 10 }, { width: 50, height: 30 }, guides, 2);

    expect(result.correctedPosition).toEqual({ x: 10, y: 10 });
  });

  it('ガイドが空の場合は元の位置を返す', () => {
    const result = applySnap({ x: 10, y: 20 }, { width: 50, height: 30 }, { x: [], y: [] }, 2);

    expect(result.correctedPosition).toEqual({ x: 10, y: 20 });
    expect(result.activeGuides.x).toHaveLength(0);
    expect(result.activeGuides.y).toHaveLength(0);
  });

  it('右辺がスナップする場合も補正する', () => {
    const guides = {
      x: [{ value: 100, sourceBoxId: 'other', edge: 'left' as const }],
      y: [],
    };

    // boxRight = 51 + 50 = 101, distance to 100 = 1
    const result = applySnap({ x: 51, y: 10 }, { width: 50, height: 30 }, guides, 2);

    // 右辺(101)がsnap先(100)に合うように x を -1 する
    expect(result.correctedPosition.x).toBe(50);
  });

  it('アクティブなガイドを返す', () => {
    const guide = { value: 100, sourceBoxId: 'other', edge: 'left' as const };
    const guides = { x: [guide], y: [] };

    const result = applySnap({ x: 99, y: 10 }, { width: 50, height: 30 }, guides, 2);

    expect(result.activeGuides.x).toHaveLength(1);
    expect(result.activeGuides.x[0]).toEqual(guide);
  });
});
