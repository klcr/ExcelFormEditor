import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useZoom } from './useZoom';

describe('useZoom', () => {
  it('初期スケールが1.0である', () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.scale).toBe(1.0);
  });

  it('Ctrl+ホイール上でズームインする', () => {
    const { result } = renderHook(() => useZoom());
    act(() => {
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: -100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).toBe(1.1);
  });

  it('Ctrl+ホイール下でズームアウトする', () => {
    const { result } = renderHook(() => useZoom());
    act(() => {
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: 100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).toBe(0.9);
  });

  it('Ctrlなしのホイールは無視する', () => {
    const { result } = renderHook(() => useZoom());
    act(() => {
      result.current.handleWheel({
        ctrlKey: false,
        deltaY: -100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).toBe(1.0);
  });

  it('最大値を超えない', () => {
    const { result } = renderHook(() => useZoom({ max: 1.1 }));
    act(() => {
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: -100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).toBe(1.1);
    act(() => {
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: -100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).toBe(1.1);
  });

  it('最小値を下回らない', () => {
    const { result } = renderHook(() => useZoom({ min: 0.9 }));
    act(() => {
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: 100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).toBe(0.9);
    act(() => {
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: 100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).toBe(0.9);
  });

  it('resetZoomで1.0に戻る', () => {
    const { result } = renderHook(() => useZoom());
    act(() => {
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: -100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
      result.current.handleWheel({
        ctrlKey: true,
        deltaY: -100,
        preventDefault: () => {},
      } as unknown as WheelEvent);
    });
    expect(result.current.scale).not.toBe(1.0);
    act(() => {
      result.current.resetZoom();
    });
    expect(result.current.scale).toBe(1.0);
  });
});
