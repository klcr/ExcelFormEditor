import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUndoRedo } from './useUndoRedo';

describe('useUndoRedo', () => {
  it('初期状態では canUndo=false, canRedo=false', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    expect(result.current.current).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushState 後に canUndo=true, canRedo=false', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.pushState('b'));

    expect(result.current.current).toBe('b');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo で前の状態に戻る', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.pushState('b'));
    act(() => result.current.undo());

    expect(result.current.current).toBe('a');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo でやり直す', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.pushState('b'));
    act(() => result.current.undo());
    act(() => result.current.redo());

    expect(result.current.current).toBe('b');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('複数の undo/redo サイクル', () => {
    const { result } = renderHook(() => useUndoRedo(1));
    act(() => result.current.pushState(2));
    act(() => result.current.pushState(3));
    act(() => result.current.pushState(4));

    act(() => result.current.undo());
    expect(result.current.current).toBe(3);

    act(() => result.current.undo());
    expect(result.current.current).toBe(2);

    act(() => result.current.redo());
    expect(result.current.current).toBe(3);

    act(() => result.current.redo());
    expect(result.current.current).toBe(4);
  });

  it('pushState 後に future がクリアされる', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.pushState('b'));
    act(() => result.current.pushState('c'));
    act(() => result.current.undo()); // 'b'
    act(() => result.current.pushState('d')); // future cleared

    expect(result.current.current).toBe('d');
    expect(result.current.canRedo).toBe(false);
  });

  it('maxHistory で past のサイズを制限する', () => {
    const { result } = renderHook(() => useUndoRedo(0, 3));

    for (let i = 1; i <= 5; i++) {
      act(() => result.current.pushState(i));
    }

    // maxHistory=3 なので past は最新3件のみ
    expect(result.current.current).toBe(5);

    act(() => result.current.undo());
    expect(result.current.current).toBe(4);
    act(() => result.current.undo());
    expect(result.current.current).toBe(3);
    act(() => result.current.undo());
    expect(result.current.current).toBe(2);
    // これ以上 undo できない（0と1は消えている）
    act(() => result.current.undo());
    expect(result.current.current).toBe(2); // 変わらない
  });

  it('reset でヒストリをクリアする', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.pushState('b'));
    act(() => result.current.pushState('c'));
    act(() => result.current.reset('x'));

    expect(result.current.current).toBe('x');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('past が空のとき undo はノーオプ', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.undo());
    expect(result.current.current).toBe('a');
  });

  it('future が空のとき redo はノーオプ', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.redo());
    expect(result.current.current).toBe('a');
  });
});
