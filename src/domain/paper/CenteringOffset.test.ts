import { describe, expect, it } from 'vitest';
import { calculateCenteringOffset, calculateContentBounds } from './CenteringOffset';

describe('calculateContentBounds', () => {
  it('ボックスのみの境界を返す', () => {
    const boxes = [
      { position: { x: 10, y: 20 }, size: { width: 30, height: 40 } },
      { position: { x: 50, y: 5 }, size: { width: 20, height: 10 } },
    ];
    const result = calculateContentBounds(boxes, []);
    expect(result).toEqual({ minX: 10, minY: 5, maxX: 70, maxY: 60 });
  });

  it('線分端点のみの境界を返す', () => {
    const endpoints = [
      { x: 5, y: 10 },
      { x: 100, y: 200 },
    ];
    const result = calculateContentBounds([], endpoints);
    expect(result).toEqual({ minX: 5, minY: 10, maxX: 100, maxY: 200 });
  });

  it('ボックスと線分を統合した境界を返す', () => {
    const boxes = [{ position: { x: 10, y: 10 }, size: { width: 50, height: 50 } }];
    const endpoints = [{ x: 0, y: 80 }];
    const result = calculateContentBounds(boxes, endpoints);
    expect(result).toEqual({ minX: 0, minY: 10, maxX: 60, maxY: 80 });
  });

  it('空の場合nullを返す', () => {
    expect(calculateContentBounds([], [])).toBeNull();
  });
});

describe('calculateCenteringOffset', () => {
  const printableArea = { width: 200, height: 300 };
  const boxes = [{ position: { x: 10, y: 20 }, size: { width: 80, height: 100 } }];
  // contentWidth=80, contentHeight=100, minX=10, minY=20

  it('centering無効時はオフセット(0,0)', () => {
    const result = calculateCenteringOffset(
      { horizontal: false, vertical: false },
      printableArea,
      boxes,
      [],
    );
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('水平中央揃えのオフセットを計算する', () => {
    const result = calculateCenteringOffset(
      { horizontal: true, vertical: false },
      printableArea,
      boxes,
      [],
    );
    // dx = (200 - 80) / 2 - 10 = 60 - 10 = 50
    expect(result.x).toBe(50);
    expect(result.y).toBe(0);
  });

  it('垂直中央揃えのオフセットを計算する', () => {
    const result = calculateCenteringOffset(
      { horizontal: false, vertical: true },
      printableArea,
      boxes,
      [],
    );
    // dy = (300 - 100) / 2 - 20 = 100 - 20 = 80
    expect(result.x).toBe(0);
    expect(result.y).toBe(80);
  });

  it('水平・垂直両方の中央揃え', () => {
    const result = calculateCenteringOffset(
      { horizontal: true, vertical: true },
      printableArea,
      boxes,
      [],
    );
    expect(result.x).toBe(50);
    expect(result.y).toBe(80);
  });

  it('コンテンツが空の場合はオフセット(0,0)', () => {
    const result = calculateCenteringOffset(
      { horizontal: true, vertical: true },
      printableArea,
      [],
      [],
    );
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('原点(0,0)始点のコンテンツを中央揃え', () => {
    const boxesAtOrigin = [{ position: { x: 0, y: 0 }, size: { width: 100, height: 200 } }];
    const result = calculateCenteringOffset(
      { horizontal: true, vertical: true },
      printableArea,
      boxesAtOrigin,
      [],
    );
    // dx = (200 - 100) / 2 - 0 = 50
    // dy = (300 - 200) / 2 - 0 = 50
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
  });
});
