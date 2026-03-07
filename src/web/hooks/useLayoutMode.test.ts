import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutMode } from './useLayoutMode';

type ChangeListener = (e: MediaQueryListEvent) => void;

function createMockMql(initialMatches: boolean) {
  const listeners: ChangeListener[] = [];
  const mql = {
    matches: initialMatches,
    media: '(orientation: portrait)',
    addEventListener: vi.fn((event: string, handler: ChangeListener) => {
      if (event === 'change') listeners.push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: ChangeListener) => {
      if (event === 'change') {
        const idx = listeners.indexOf(handler);
        if (idx >= 0) listeners.splice(idx, 1);
      }
    }),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  const fireChange = (matches: boolean) => {
    for (const listener of [...listeners]) {
      listener({ matches, media: '(orientation: portrait)' } as MediaQueryListEvent);
    }
  };

  return { mql, fireChange, listeners };
}

describe('useLayoutMode', () => {
  let mockMql: ReturnType<typeof createMockMql>;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockMql = createMockMql(false);
    window.matchMedia = vi.fn().mockReturnValue(mockMql.mql);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('landscape（デフォルト）で desktop を返す', () => {
    const { result } = renderHook(() => useLayoutMode());
    expect(result.current).toBe('desktop');
  });

  it('portrait で mobile を返す', () => {
    mockMql = createMockMql(true);
    window.matchMedia = vi.fn().mockReturnValue(mockMql.mql);

    const { result } = renderHook(() => useLayoutMode());
    expect(result.current).toBe('mobile');
  });

  it('matchMedia の change リスナーを登録する', () => {
    renderHook(() => useLayoutMode());
    expect(mockMql.mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('orientation 変更時にモードが切り替わる', () => {
    const { result } = renderHook(() => useLayoutMode());
    expect(result.current).toBe('desktop');

    act(() => {
      mockMql.fireChange(true);
    });
    expect(result.current).toBe('mobile');

    act(() => {
      mockMql.fireChange(false);
    });
    expect(result.current).toBe('desktop');
  });

  it('アンマウント時にリスナーを解除する', () => {
    const { unmount } = renderHook(() => useLayoutMode());
    unmount();
    expect(mockMql.mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockMql.listeners).toHaveLength(0);
  });
});
