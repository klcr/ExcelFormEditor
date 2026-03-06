import { beforeEach, describe, expect, it } from 'vitest';
import { createLine, generateLineId, resetLineIdCounter } from './Line';

describe('createLine', () => {
  it('最小パラメータでデフォルト値を適用する', () => {
    const line = createLine({
      id: 'line-test-1',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    });

    expect(line.id).toBe('line-test-1');
    expect(line.start).toEqual({ x: 0, y: 0 });
    expect(line.end).toEqual({ x: 100, y: 0 });
    expect(line.style).toBe('thin');
    expect(line.color).toBe('000000');
  });

  it('全パラメータを指定した場合はそのまま適用する', () => {
    const line = createLine({
      id: 'line-test-2',
      start: { x: 10, y: 20 },
      end: { x: 50, y: 20 },
      style: 'medium',
      color: 'FF0000',
    });

    expect(line.style).toBe('medium');
    expect(line.color).toBe('FF0000');
  });

  it('垂直線を作成できる', () => {
    const line = createLine({
      id: 'v-line',
      start: { x: 50, y: 0 },
      end: { x: 50, y: 100 },
    });

    expect(line.start.x).toBe(line.end.x);
  });
});

describe('generateLineId', () => {
  beforeEach(() => {
    resetLineIdCounter();
  });

  it('連番の ID を生成する', () => {
    expect(generateLineId()).toBe('line-1');
    expect(generateLineId()).toBe('line-2');
    expect(generateLineId()).toBe('line-3');
  });

  it('リセット後はカウンタが 0 に戻る', () => {
    generateLineId();
    generateLineId();
    resetLineIdCounter();
    expect(generateLineId()).toBe('line-1');
  });
});
