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
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
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
    const box1 = result.current.boxes[0];
    expect(box1?.rect.size).toEqual({ width: 30, height: 25 });

    act(() => result.current.actions.resizeBox('b1', { width: 0.5, height: 0.5 }));
    const box1After = result.current.boxes[0];
    expect(box1After?.rect.size).toEqual({ width: 2, height: 2 });
  });

  it('setDragging updates isDragging state', () => {
    const { result } = renderHook(() => useBoxEditor());

    act(() => result.current.actions.setDragging(true));
    expect(result.current.isDragging).toBe(true);

    act(() => result.current.actions.setDragging(false));
    expect(result.current.isDragging).toBe(false);
  });

  it('setBoxes replaces boxes array and resets history', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1')]));

    act(() => result.current.actions.moveSelectedBoxes({ x: 1, y: 1 }));

    const newBoxes = [makeBox('b2'), makeBox('b3')];
    act(() => result.current.actions.setBoxes(newBoxes));
    expect(result.current.boxes).toHaveLength(2);
    expect(result.current.boxes[0]?.id).toBe('b2');
    expect(result.current.canUndo).toBe(false);
  });

  // --- Undo/Redo ---

  it('undo reverts the last box mutation', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1', 10, 20)]));

    act(() => result.current.actions.selectBox('b1'));
    act(() => result.current.actions.moveSelectedBoxes({ x: 5, y: 0 }));
    expect(result.current.boxes[0]?.rect.position.x).toBe(15);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.actions.undo());
    expect(result.current.boxes[0]?.rect.position.x).toBe(10);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo re-applies the undone mutation', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1', 10, 20)]));

    act(() => result.current.actions.selectBox('b1'));
    act(() => result.current.actions.moveSelectedBoxes({ x: 5, y: 0 }));
    act(() => result.current.actions.undo());
    act(() => result.current.actions.redo());

    expect(result.current.boxes[0]?.rect.position.x).toBe(15);
    expect(result.current.canRedo).toBe(false);
  });

  // --- Split ---

  it('splitBox splits a box horizontally into two', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1', 0, 0, 20, 10)]));

    act(() => result.current.actions.splitBox('b1', 'horizontal'));

    expect(result.current.boxes).toHaveLength(2);
    expect(result.current.boxes.find((b) => b.id === 'b1')).toBeUndefined();
    const [top, bottom] = result.current.boxes;
    expect(top?.rect.size.height).toBe(5);
    expect(bottom?.rect.size.height).toBe(5);
    expect(bottom?.rect.position.y).toBe(5);
    expect(result.current.selectedBoxIds).toHaveLength(2);
  });

  it('splitBox splits a box vertically into two', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1', 0, 0, 20, 10)]));

    act(() => result.current.actions.splitBox('b1', 'vertical'));

    expect(result.current.boxes).toHaveLength(2);
    const [left, right] = result.current.boxes;
    expect(left?.rect.size.width).toBe(10);
    expect(right?.rect.size.width).toBe(10);
    expect(right?.rect.position.x).toBe(10);
  });

  it('splitBox is no-op for non-existent box id', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1')]));

    act(() => result.current.actions.splitBox('nonexistent', 'horizontal'));
    expect(result.current.boxes).toHaveLength(1);
  });

  // --- Merge ---

  it('mergeSelectedBoxes merges selected boxes into one', () => {
    const { result } = renderHook(() =>
      useBoxEditor([makeBox('b1', 0, 0, 10, 5), makeBox('b2', 10, 0, 10, 5)]),
    );

    act(() => result.current.actions.toggleBoxSelection('b1'));
    act(() => result.current.actions.toggleBoxSelection('b2'));
    act(() => result.current.actions.mergeSelectedBoxes());

    expect(result.current.boxes).toHaveLength(1);
    const merged = result.current.boxes[0];
    expect(merged?.rect.size).toEqual({ width: 20, height: 5 });
    expect(result.current.selectedBoxIds).toHaveLength(1);
  });

  it('mergeSelectedBoxes is no-op when boxes cannot merge', () => {
    const { result } = renderHook(() =>
      useBoxEditor([makeBox('b1', 0, 0, 10, 5), makeBox('b2', 20, 0, 10, 5)]),
    );

    act(() => result.current.actions.toggleBoxSelection('b1'));
    act(() => result.current.actions.toggleBoxSelection('b2'));
    act(() => result.current.actions.mergeSelectedBoxes());

    expect(result.current.boxes).toHaveLength(2);
  });

  // --- Delete ---

  it('deleteSelectedBoxes removes selected boxes', () => {
    const { result } = renderHook(() =>
      useBoxEditor([makeBox('b1'), makeBox('b2'), makeBox('b3')]),
    );

    act(() => result.current.actions.toggleBoxSelection('b1'));
    act(() => result.current.actions.toggleBoxSelection('b3'));
    act(() => result.current.actions.deleteSelectedBoxes());

    expect(result.current.boxes).toHaveLength(1);
    expect(result.current.boxes[0]?.id).toBe('b2');
    expect(result.current.selectedBoxIds).toEqual([]);
  });

  it('deleteSelectedBoxes is no-op when nothing is selected', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1')]));

    act(() => result.current.actions.deleteSelectedBoxes());
    expect(result.current.boxes).toHaveLength(1);
    expect(result.current.canUndo).toBe(false);
  });

  // --- activeGuides ---

  it('activeGuides returns empty result when no snap provided', () => {
    const { result } = renderHook(() => useBoxEditor());
    expect(result.current.activeGuides).toEqual({ x: [], y: [] });
  });

  // --- Undo after split/delete ---

  it('undo reverts splitBox', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1', 0, 0, 20, 10)]));

    act(() => result.current.actions.splitBox('b1', 'horizontal'));
    expect(result.current.boxes).toHaveLength(2);

    act(() => result.current.actions.undo());
    expect(result.current.boxes).toHaveLength(1);
    expect(result.current.boxes[0]?.id).toBe('b1');
  });

  it('undo reverts deleteSelectedBoxes', () => {
    const { result } = renderHook(() => useBoxEditor([makeBox('b1'), makeBox('b2')]));

    act(() => result.current.actions.selectBox('b1'));
    act(() => result.current.actions.deleteSelectedBoxes());
    expect(result.current.boxes).toHaveLength(1);

    act(() => result.current.actions.undo());
    expect(result.current.boxes).toHaveLength(2);
  });
});
