import type { BoxDefinition, SnapGuidePoint, SnapGuideResult } from '@domain/box';
import { EMPTY_SNAP_GUIDE_RESULT, applySnap, findSnapGuides } from '@domain/box';
import type { Position, Size } from '@domain/shared';
import { useCallback, useState } from 'react';

type UseSnapOptions = {
  readonly threshold?: number;
  readonly enabled?: boolean;
};

type UseSnapReturn = {
  readonly computeSnappedPosition: (
    movingBox: BoxDefinition,
    allBoxes: readonly BoxDefinition[],
    proposedPosition: Position,
  ) => Position;
  readonly computeSnappedSize: (
    resizingBox: BoxDefinition,
    allBoxes: readonly BoxDefinition[],
    proposedSize: Size,
    anchorPosition: Position,
  ) => Size;
  readonly activeGuides: SnapGuideResult;
  readonly clearGuides: () => void;
};

const DEFAULT_THRESHOLD = 2;

/**
 * スナップロジックを管理するフック
 * Domain 層の findSnapGuides / applySnap を内部で呼ぶ
 */
export function useSnap(options?: UseSnapOptions): UseSnapReturn {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const enabled = options?.enabled ?? true;
  const [activeGuides, setActiveGuides] = useState<SnapGuideResult>(EMPTY_SNAP_GUIDE_RESULT);

  const computeSnappedPosition = useCallback(
    (
      movingBox: BoxDefinition,
      allBoxes: readonly BoxDefinition[],
      proposedPosition: Position,
    ): Position => {
      if (!enabled) {
        setActiveGuides(EMPTY_SNAP_GUIDE_RESULT);
        return proposedPosition;
      }

      const virtualBox: BoxDefinition = {
        ...movingBox,
        rect: { ...movingBox.rect, position: proposedPosition },
      };
      const guides = findSnapGuides(virtualBox, allBoxes, threshold);
      const { correctedPosition, activeGuides: active } = applySnap(
        proposedPosition,
        movingBox.rect.size,
        guides,
        threshold,
      );
      setActiveGuides(active);
      return correctedPosition;
    },
    [threshold, enabled],
  );

  const computeSnappedSize = useCallback(
    (
      resizingBox: BoxDefinition,
      allBoxes: readonly BoxDefinition[],
      proposedSize: Size,
      anchorPosition: Position,
    ): Size => {
      if (!enabled) {
        setActiveGuides(EMPTY_SNAP_GUIDE_RESULT);
        return proposedSize;
      }

      const virtualBox: BoxDefinition = {
        ...resizingBox,
        rect: { position: anchorPosition, size: proposedSize },
      };
      const guides = findSnapGuides(virtualBox, allBoxes, threshold);

      // リサイズ時はサイズの端がスナップする
      const rightEdge = anchorPosition.x + proposedSize.width;
      const bottomEdge = anchorPosition.y + proposedSize.height;

      let snappedWidth = proposedSize.width;
      let snappedHeight = proposedSize.height;
      const activeX: SnapGuidePoint[] = [];
      const activeY: SnapGuidePoint[] = [];

      for (const point of guides.x) {
        const dist = Math.abs(rightEdge - point.value);
        if (dist <= threshold) {
          snappedWidth = point.value - anchorPosition.x;
          activeX.push(point);
          break;
        }
      }

      for (const point of guides.y) {
        const dist = Math.abs(bottomEdge - point.value);
        if (dist <= threshold) {
          snappedHeight = point.value - anchorPosition.y;
          activeY.push(point);
          break;
        }
      }

      setActiveGuides({ x: activeX, y: activeY });
      return { width: Math.max(snappedWidth, 2), height: Math.max(snappedHeight, 2) };
    },
    [threshold, enabled],
  );

  const clearGuides = useCallback(() => {
    setActiveGuides(EMPTY_SNAP_GUIDE_RESULT);
  }, []);

  return {
    computeSnappedPosition,
    computeSnappedSize,
    activeGuides,
    clearGuides,
  };
}
