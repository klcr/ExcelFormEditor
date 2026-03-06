import type { Position, Size } from '@domain/shared';
import type { BoxDefinition } from './BoxTypes';

/** スナップガイドのエッジ種別 */
export type SnapEdge = 'left' | 'right' | 'top' | 'bottom';

/** スナップガイドの候補 */
export type SnapGuidePoint = {
  readonly value: number;
  readonly sourceBoxId: string;
  readonly edge: SnapEdge;
};

/** スナップガイド検索結果 */
export type SnapGuideResult = {
  readonly x: readonly SnapGuidePoint[];
  readonly y: readonly SnapGuidePoint[];
};

/** 空のスナップガイド結果 */
export const EMPTY_SNAP_GUIDE_RESULT: SnapGuideResult = { x: [], y: [] };

/**
 * ドラッグ中のボックスに対して、他ボックスのエッジからスナップガイド候補を返す
 * threshold (mm) 以内のエッジのみ
 */
export function findSnapGuides(
  box: BoxDefinition,
  others: readonly BoxDefinition[],
  threshold: number,
): SnapGuideResult {
  const boxLeft = box.rect.position.x;
  const boxRight = boxLeft + box.rect.size.width;
  const boxTop = box.rect.position.y;
  const boxBottom = boxTop + box.rect.size.height;
  const boxEdgesX = [boxLeft, boxRight];
  const boxEdgesY = [boxTop, boxBottom];

  const xPoints: SnapGuidePoint[] = [];
  const yPoints: SnapGuidePoint[] = [];

  for (const other of others) {
    if (other.id === box.id) continue;

    const otherLeft = other.rect.position.x;
    const otherRight = otherLeft + other.rect.size.width;
    const otherTop = other.rect.position.y;
    const otherBottom = otherTop + other.rect.size.height;

    const otherXEdges: Array<{ value: number; edge: SnapEdge }> = [
      { value: otherLeft, edge: 'left' },
      { value: otherRight, edge: 'right' },
    ];
    const otherYEdges: Array<{ value: number; edge: SnapEdge }> = [
      { value: otherTop, edge: 'top' },
      { value: otherBottom, edge: 'bottom' },
    ];

    for (const bx of boxEdgesX) {
      for (const oe of otherXEdges) {
        if (Math.abs(bx - oe.value) <= threshold) {
          xPoints.push({ value: oe.value, sourceBoxId: other.id, edge: oe.edge });
        }
      }
    }

    for (const by of boxEdgesY) {
      for (const oe of otherYEdges) {
        if (Math.abs(by - oe.value) <= threshold) {
          yPoints.push({ value: oe.value, sourceBoxId: other.id, edge: oe.edge });
        }
      }
    }
  }

  return {
    x: deduplicatePoints(xPoints),
    y: deduplicatePoints(yPoints),
  };
}

/**
 * スナップガイド結果から最も近いスナップ先に位置を補正する
 */
export function applySnap(
  currentPosition: Position,
  boxSize: Size,
  guides: SnapGuideResult,
  threshold: number,
): { readonly correctedPosition: Position; readonly activeGuides: SnapGuideResult } {
  const boxLeft = currentPosition.x;
  const boxRight = currentPosition.x + boxSize.width;
  const boxTop = currentPosition.y;
  const boxBottom = currentPosition.y + boxSize.height;

  let bestDx = Number.POSITIVE_INFINITY;
  let snapX: number | null = null;
  const activeXGuides: SnapGuidePoint[] = [];

  for (const point of guides.x) {
    const distLeft = Math.abs(boxLeft - point.value);
    const distRight = Math.abs(boxRight - point.value);
    const minDist = Math.min(distLeft, distRight);

    if (minDist <= threshold && minDist < Math.abs(bestDx)) {
      bestDx = distLeft <= distRight ? point.value - boxLeft : point.value - boxRight;
      snapX = bestDx;
      activeXGuides.length = 0;
      activeXGuides.push(point);
    } else if (snapX !== null && Math.abs(minDist - Math.abs(bestDx)) < 0.001) {
      activeXGuides.push(point);
    }
  }

  let bestDy = Number.POSITIVE_INFINITY;
  let snapY: number | null = null;
  const activeYGuides: SnapGuidePoint[] = [];

  for (const point of guides.y) {
    const distTop = Math.abs(boxTop - point.value);
    const distBottom = Math.abs(boxBottom - point.value);
    const minDist = Math.min(distTop, distBottom);

    if (minDist <= threshold && minDist < Math.abs(bestDy)) {
      bestDy = distTop <= distBottom ? point.value - boxTop : point.value - boxBottom;
      snapY = bestDy;
      activeYGuides.length = 0;
      activeYGuides.push(point);
    } else if (snapY !== null && Math.abs(minDist - Math.abs(bestDy)) < 0.001) {
      activeYGuides.push(point);
    }
  }

  return {
    correctedPosition: {
      x: currentPosition.x + (snapX ?? 0),
      y: currentPosition.y + (snapY ?? 0),
    },
    activeGuides: {
      x: activeXGuides,
      y: activeYGuides,
    },
  };
}

function deduplicatePoints(points: SnapGuidePoint[]): SnapGuidePoint[] {
  const seen = new Set<string>();
  return points.filter((p) => {
    const key = `${p.value}:${p.sourceBoxId}:${p.edge}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
