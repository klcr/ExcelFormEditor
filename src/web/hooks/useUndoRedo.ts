import { useCallback, useState } from 'react';

type HistoryState<T> = {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
};

type UseUndoRedoReturn<T> = {
  readonly current: T;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly pushState: (state: T) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly reset: (state: T) => void;
};

const DEFAULT_MAX_HISTORY = 50;

/**
 * 汎用 Undo/Redo フック
 * ヒストリスタックパターンで状態の巻き戻し・やり直しを管理する
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = DEFAULT_MAX_HISTORY,
): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const pushState = useCallback(
    (state: T) => {
      setHistory((prev) => {
        const newPast =
          prev.past.length >= maxHistory
            ? [...prev.past.slice(1), prev.present]
            : [...prev.past, prev.present];
        return { past: newPast, present: state, future: [] };
      });
    },
    [maxHistory],
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      const lastIndex = prev.past.length - 1;
      if (lastIndex < 0) return prev;
      const previous = prev.past[lastIndex] as T;
      const newPast = prev.past.slice(0, lastIndex);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0] as T;
      const rest = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: rest,
      };
    });
  }, []);

  const reset = useCallback((state: T) => {
    setHistory({ past: [], present: state, future: [] });
  }, []);

  return {
    current: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    pushState,
    undo,
    redo,
    reset,
  };
}
