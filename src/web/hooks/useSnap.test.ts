import type { BoxDefinition } from '@domain/box';
import { createBox, resetBoxIdCounter } from '@domain/box';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSnap } from './useSnap';

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
      size: { width: overrides.w ?? 50, height: overrides.h ?? 30 },
    },
  });
}

describe('useSnap', () => {
  beforeEach(() => resetBoxIdCounter());

  it('近傍のエッジにスナップする', () => {
    const { result } = renderHook(() => useSnap({ threshold: 2 }));
    const moving = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 30 });
    const other = makeBox({ id: 'b', x: 100, y: 0, w: 50, h: 30 });

    let snapped = { x: 0, y: 0 };
    act(() => {
      snapped = result.current.computeSnappedPosition(moving, [moving, other], { x: 49, y: 0 });
    });

    expect(snapped.x).toBe(50); // 右辺が100にスナップ → x=50
  });

  it('enabled=false ではスナップしない', () => {
    const { result } = renderHook(() => useSnap({ enabled: false }));
    const moving = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 30 });
    const other = makeBox({ id: 'b', x: 100, y: 0, w: 50, h: 30 });

    let snapped = { x: 0, y: 0 };
    act(() => {
      snapped = result.current.computeSnappedPosition(moving, [moving, other], { x: 49, y: 0 });
    });

    expect(snapped.x).toBe(49); // スナップなし
  });

  it('clearGuides でアクティブガイドをクリアする', () => {
    const { result } = renderHook(() => useSnap({ threshold: 2 }));
    const moving = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 30 });
    const other = makeBox({ id: 'b', x: 100, y: 0, w: 50, h: 30 });

    act(() => {
      result.current.computeSnappedPosition(moving, [moving, other], { x: 49, y: 0 });
    });

    act(() => {
      result.current.clearGuides();
    });

    expect(result.current.activeGuides.x).toHaveLength(0);
    expect(result.current.activeGuides.y).toHaveLength(0);
  });

  it('computeSnappedSize でリサイズ時にスナップする', () => {
    const { result } = renderHook(() => useSnap({ threshold: 2 }));
    const resizing = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 30 });
    const other = makeBox({ id: 'b', x: 100, y: 0, w: 50, h: 30 });

    let snapped = { width: 0, height: 0 };
    act(() => {
      snapped = result.current.computeSnappedSize(
        resizing,
        [resizing, other],
        { width: 99, height: 30 },
        { x: 0, y: 0 },
      );
    });

    expect(snapped.width).toBe(100); // 右辺が100にスナップ
  });
});
