import { describe, expect, it } from 'vitest';
import { findParentSvg, screenToSvgCoords } from './svgCoordinates';

describe('screenToSvgCoords', () => {
  it('CTM が null の場合はクライアント座標をそのまま返す', () => {
    const svgElement = {
      createSVGPoint: () => ({ x: 0, y: 0, matrixTransform: () => ({ x: 0, y: 0 }) }),
      getScreenCTM: () => null,
    } as unknown as SVGSVGElement;

    const result = screenToSvgCoords(svgElement, 100, 200);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('CTM が存在する場合は変換後の座標を返す', () => {
    const transformedPoint = { x: 50, y: 75 };
    const svgElement = {
      createSVGPoint: () => ({
        x: 0,
        y: 0,
        matrixTransform: () => transformedPoint,
      }),
      getScreenCTM: () => ({
        inverse: () => ({}),
      }),
    } as unknown as SVGSVGElement;

    const result = screenToSvgCoords(svgElement, 100, 200);
    expect(result).toEqual({ x: 50, y: 75 });
  });
});

describe('findParentSvg', () => {
  it('要素自体が SVGSVGElement の場合はそのまま返す', () => {
    const svgElement = Object.create(SVGSVGElement.prototype);
    const result = findParentSvg(svgElement);
    expect(result).toBe(svgElement);
  });

  it('親が見つからない場合は null を返す', () => {
    const div = document.createElement('div');
    const result = findParentSvg(div);
    expect(result).toBeNull();
  });
});
