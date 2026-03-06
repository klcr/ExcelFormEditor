import { createBox } from '@domain/box';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBoxEditor } from './useBoxEditor';

function makeBox(id: string, x = 0, y = 0, width = 10, height = 5) {
  return createBox({
    id,
    rect: { position: { x, y }, size: { width, height } },
  });
}

describe('useBoxEditor', () => {
  it('initializes with empty selection and given boxes', () => {
    const boxes = [makeBox('b1'), makeBox('b2')];
    const { result } = renderHook(() => useBoxEditor(boxes));

    expect(result.current.selectedBoxIds).toEqual([]);
    expect(result.current.boxes).toHaveLength(2);
    expect(result.current.isDragging).toBe(false);
  });

  it('selectBox sets single selection', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1'), makeBox('b2')]));

    act(() => result.current.actions.selectBox('b1'));
    expect(result.current.selectedBoxIds).toEqual(['b1']);

    act(() => result.current.actions.selectBox('b2'));
    expect(result.current.selectedBoxIds).toEqual(['b2']);
  });

  it('deselectAll clears selection', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1')]));

    act(() => result.current.actions.selectBox('b1'));
    act(() => result.current.actions.deselectAll());
    expect(result.current.selectedBoxIds).toEqual([]);
  });

  it('toggleBoxSelection adds and removes from multi-select', () => {
    const { result } = renderHook(() =>
      useBoxEditor([makeBox('b1'), makeBox('b2'), makeBox('b3')]),
    );

    act(() => result.current.actions.toggleBoxSelection('b1'));
    expect(result.current.selectedBoxIds).toEqual(['b1']);

    act(() => result.current.actions.toggleBoxSelection('b2'));
    expect(result.current.selectedBoxIds).toEqual(['b1', 'b2']);

    act(() => result.current.actions.toggleBoxSelection('b1'));
    expect(result.current.selectedBoxIds).toEqual(['b2']);
  });

  it('moveSelectedBoxes updates positions of selected boxes only', () => {
    const { result } = renderHook(() =>
      useBoxEditor([makeBox('b1', 10, 20), makeBox('b2', 30, 40)]),
    );

    act(() => result.current.actions.selectBox('b1'));
    act(() => result.current.actions.moveSelectedBoxes({ x: 5, y: -3 }));

    const b1 = result.current.boxes.find((b) => b.id === 'b1');
    const b2 = result.current.boxes.find((b) => b.id === 'b2');
    expect(b1?.rect.position).toEqual({ x: 15, y: 17 });
    expect(b2?.rect.position).toEqual({ x: 30, y: 40 });
  });

  it('resizeBox updates size with minimum enforcement', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1', 0, 0, 20, 15)]));

    act(() => result.current.actions.resizeBox('b1', { width: 30, height: 25 }));
    expect(result.current.boxes[0].rect.size).toEqual({ width: 30, height: 25 });

    act(() => result.current.actions.resizeBox('b1', { width: 0.5, height: 0.5 }));
    expect(result.current.boxes[0].rect.size).toEqual({ width: 2, height: 2 });
  });

  it('setDragging updates isDragging state', () => {
    const { result } = renderHook(() => useBoxEditor());

    act(() => result.current.actions.setDragging(true));
    expect(result.current.isDragging).toBe(true);

    act(() => result.current.actions.setDragging(false));
    expect(result.current.isDragging).toBe(false);
  });

  it('setBoxes replaces boxes array', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1')]));

    const newBoxes = [makeBox('b2'), makeBox('b3')];
    act(() => result.current.actions.setBoxes(newBoxes));
    expect(result.current.boxes).toHaveLength(2);
    expect(result.current.boxes[0].id).toBe('b2');
  });
});
