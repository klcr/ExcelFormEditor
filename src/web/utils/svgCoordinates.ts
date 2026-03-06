import type { Position } from '@domain/shared';

/**
 * スクリーン（クライアント）座標を SVG 座標系に変換する。
 * SVG 要素に viewBox が設定されている必要がある。
 */
export function screenToSvgCoords(
  svgElement: SVGSVGElement,
  clientX: number,
  clientY: number,
): Position {
  const point = svgElement.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = svgElement.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const svgPoint = point.matrixTransform(ctm.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

/**
 * 要素から親の SVGSVGElement を探す
 */
export function findParentSvg(element: Element): SVGSVGElement | null {
  let current: Element | null = element;
  while (current) {
    if (current instanceof SVGSVGElement) return current;
    current = current.parentElement;
  }
  return null;
}
