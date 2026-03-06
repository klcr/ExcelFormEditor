import { useEffect } from 'react';

type KeyboardShortcutActions = {
  readonly undo: () => void;
  readonly redo: () => void;
  readonly deleteSelectedBoxes: () => void;
  readonly deselectAll: () => void;
};

type UseKeyboardShortcutsOptions = {
  readonly actions: KeyboardShortcutActions;
  readonly enabled?: boolean;
};

/**
 * グローバルキーボードショートカットを管理するフック
 *
 * - Ctrl+Z → undo
 * - Ctrl+Y / Ctrl+Shift+Z → redo
 * - Delete / Backspace → deleteSelectedBoxes
 * - Escape → deselectAll
 */
export function useKeyboardShortcuts({
  actions,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
        return;
      }

      if (ctrl && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
        e.preventDefault();
        actions.redo();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        actions.deleteSelectedBoxes();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        actions.deselectAll();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions, enabled]);
}
