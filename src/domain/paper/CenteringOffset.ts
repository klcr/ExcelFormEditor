import type { Position, Rect, Size } from '@domain/shared';
import type { PaperCentering } from './PaperTypes';

/**
 * ボックス群と線分群からコンテンツの境界ボックスを算出する。
 * ボックスは Rect、線分は start/end の Position で表現される。
 */
export function calculateContentBounds(
  boxes: readonly Rect[],
  lineEndpoints: readonly Position[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (boxes.length === 0 && lineEndpoints.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const rect of boxes) {
    minX = Math.min(minX, rect.position.x);
    minY = Math.min(minY, rect.position.y);
    maxX = Math.max(maxX, rect.position.x + rect.size.width);
    maxY = Math.max(maxY, rect.position.y + rect.size.height);
  }

  for (const pt of lineEndpoints) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * ページ中央揃えのオフセットを算出する。
 *
 * コンテンツの境界ボックスを printableArea 内で中央に配置するための
 * 追加オフセット (dx, dy) を返す。
 *
 * horizontal: dx = (printableWidth - contentWidth) / 2 - contentMinX
 * vertical:   dy = (printableHeight - contentHeight) / 2 - contentMinY
 */
export function calculateCenteringOffset(
  centering: PaperCentering,
  printableArea: Size,
  boxes: readonly Rect[],
  lineEndpoints: readonly Position[],
): Position {
  if (!centering.horizontal && !centering.vertical) {
    return { x: 0, y: 0 };
  }

  const bounds = calculateContentBounds(boxes, lineEndpoints);
  if (!bounds) {
    return { x: 0, y: 0 };
  }

  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  const dx = centering.horizontal ? (printableArea.width - contentWidth) / 2 - bounds.minX : 0;

  const dy = centering.vertical ? (printableArea.height - contentHeight) / 2 - bounds.minY : 0;

  return { x: dx, y: dy };
}
