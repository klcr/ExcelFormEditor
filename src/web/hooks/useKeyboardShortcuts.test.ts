import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function createMockActions() {
  return {
    undo: vi.fn(),
    redo: vi.fn(),
    deleteSelectedBoxes: vi.fn(),
    deselectAll: vi.fn(),
  };
}

function fireKeyDown(options: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { ...options, bubbles: true });
  window.dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  it('Ctrl+Z で undo を呼ぶ', () => {
    const actions = createMockActions();
    renderHook(() => useKeyboardShortcuts({ actions }));

    fireKeyDown({ key: 'z', ctrlKey: true });

    expect(actions.undo).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Y で redo を呼ぶ', () => {
    const actions = createMockActions();
    renderHook(() => useKeyboardShortcuts({ actions }));

    fireKeyDown({ key: 'y', ctrlKey: true });

    expect(actions.redo).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Shift+Z で redo を呼ぶ', () => {
    const actions = createMockActions();
    renderHook(() => useKeyboardShortcuts({ actions }));

    fireKeyDown({ key: 'Z', ctrlKey: true, shiftKey: true });

    expect(actions.redo).toHaveBeenCalledTimes(1);
  });

  it('Delete で deleteSelectedBoxes を呼ぶ', () => {
    const actions = createMockActions();
    renderHook(() => useKeyboardShortcuts({ actions }));

    fireKeyDown({ key: 'Delete' });

    expect(actions.deleteSelectedBoxes).toHaveBeenCalledTimes(1);
  });

  it('Backspace で deleteSelectedBoxes を呼ぶ', () => {
    const actions = createMockActions();
    renderHook(() => useKeyboardShortcuts({ actions }));

    fireKeyDown({ key: 'Backspace' });

    expect(actions.deleteSelectedBoxes).toHaveBeenCalledTimes(1);
  });

  it('Escape で deselectAll を呼ぶ', () => {
    const actions = createMockActions();
    renderHook(() => useKeyboardShortcuts({ actions }));

    fireKeyDown({ key: 'Escape' });

    expect(actions.deselectAll).toHaveBeenCalledTimes(1);
  });

  it('enabled=false の場合、ショートカットが無効になる', () => {
    const actions = createMockActions();
    renderHook(() => useKeyboardShortcuts({ actions, enabled: false }));

    fireKeyDown({ key: 'z', ctrlKey: true });
    fireKeyDown({ key: 'y', ctrlKey: true });
    fireKeyDown({ key: 'Delete' });
    fireKeyDown({ key: 'Escape' });

    expect(actions.undo).not.toHaveBeenCalled();
    expect(actions.redo).not.toHaveBeenCalled();
    expect(actions.deleteSelectedBoxes).not.toHaveBeenCalled();
    expect(actions.deselectAll).not.toHaveBeenCalled();
  });

  it('アンマウント時にイベントリスナーが除去される', () => {
    const actions = createMockActions();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ actions }));

    unmount();

    fireKeyDown({ key: 'z', ctrlKey: true });

    expect(actions.undo).not.toHaveBeenCalled();
  });
});
