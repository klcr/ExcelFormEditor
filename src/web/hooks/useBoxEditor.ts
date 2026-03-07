import type { BoxDefinition, SnapGuideResult } from '@domain/box';
import {
  EMPTY_SNAP_GUIDE_RESULT,
  mergeBoxes,
  splitBoxHorizontal,
  splitBoxVertical,
  validateMerge,
} from '@domain/box';
import type { Position, Size } from '@domain/shared';
import { useCallback, useState } from 'react';
import type { useSnap } from './useSnap';
import { useUndoRedo } from './useUndoRedo';

/** Minimum box size in mm */
const MIN_BOX_WIDTH = 2;
const MIN_BOX_HEIGHT = 2;

type SnapFunctions = ReturnType<typeof useSnap>;

type BoxEditorOptions = {
  readonly snap?: SnapFunctions;
};

type SplitDirection = 'horizontal' | 'vertical';

type BoxEditorActions = {
  readonly selectBox: (id: string) => void;
  readonly deselectAll: () => void;
  readonly toggleBoxSelection: (id: string) => void;
  readonly moveSelectedBoxes: (delta: Position) => void;
  readonly resizeBox: (id: string, newSize: Size) => void;
  readonly updateBox: (id: string, partial: Partial<BoxDefinition>) => void;
  readonly setBoxes: (boxes: readonly BoxDefinition[]) => void;
  readonly setDragging: (isDragging: boolean) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly splitBox: (id: string, direction: SplitDirection) => void;
  readonly mergeSelectedBoxes: () => void;
  readonly deleteSelectedBoxes: () => void;
};

type UseBoxEditorReturn = {
  readonly selectedBoxIds: readonly string[];
  readonly boxes: readonly BoxDefinition[];
  readonly isDragging: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly activeGuides: SnapGuideResult;
  readonly actions: BoxEditorActions;
};

export function useBoxEditor(
  initialBoxes: readonly BoxDefinition[] = [],
  options?: BoxEditorOptions,
): UseBoxEditorReturn {
  const [selectedBoxIds, setSelectedBoxIds] = useState<readonly string[]>([]);
  const {
    current: boxes,
    pushState: pushBoxes,
    canUndo,
    canRedo,
    undo: undoBoxes,
    redo: redoBoxes,
    reset: resetBoxes,
  } = useUndoRedo<readonly BoxDefinition[]>(initialBoxes);
  const [isDragging, setDragging] = useState(false);

  const snap = options?.snap;

  const selectBox = useCallback((id: string) => {
    setSelectedBoxIds([id]);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedBoxIds([]);
  }, []);

  const toggleBoxSelection = useCallback((id: string) => {
    setSelectedBoxIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  }, []);

  const moveSelectedBoxes = useCallback(
    (delta: Position) => {
      pushBoxes(
        boxes.map((box) => {
          if (!selectedBoxIds.includes(box.id)) return box;

          const proposedPosition = {
            x: box.rect.position.x + delta.x,
            y: box.rect.position.y + delta.y,
          };

          const finalPosition =
            snap && selectedBoxIds.length === 1
              ? snap.computeSnappedPosition(box, boxes, proposedPosition)
              : proposedPosition;

          return {
            ...box,
            rect: { ...box.rect, position: finalPosition },
          };
        }),
      );
    },
    [boxes, selectedBoxIds, pushBoxes, snap],
  );

  const resizeBox = useCallback(
    (id: string, newSize: Size) => {
      const clampedSize: Size = {
        width: Math.max(newSize.width, MIN_BOX_WIDTH),
        height: Math.max(newSize.height, MIN_BOX_HEIGHT),
      };

      const target = boxes.find((b) => b.id === id);
      const finalSize =
        snap && target
          ? snap.computeSnappedSize(target, boxes, clampedSize, target.rect.position)
          : clampedSize;

      pushBoxes(
        boxes.map((box) => {
          if (box.id !== id) return box;
          return { ...box, rect: { ...box.rect, size: finalSize } };
        }),
      );
    },
    [boxes, pushBoxes, snap],
  );

  const updateBox = useCallback(
    (id: string, partial: Partial<BoxDefinition>) => {
      pushBoxes(
        boxes.map((box) => {
          if (box.id !== id) return box;
          return { ...box, ...partial, id: box.id };
        }),
      );
    },
    [boxes, pushBoxes],
  );

  const setBoxesAction = useCallback(
    (newBoxes: readonly BoxDefinition[]) => {
      resetBoxes(newBoxes);
    },
    [resetBoxes],
  );

  const setDraggingAction = useCallback(
    (dragging: boolean) => {
      setDragging(dragging);
      if (!dragging && snap) {
        snap.clearGuides();
      }
    },
    [snap],
  );

  const undo = useCallback(() => {
    undoBoxes();
  }, [undoBoxes]);

  const redo = useCallback(() => {
    redoBoxes();
  }, [redoBoxes]);

  const splitBox = useCallback(
    (id: string, direction: SplitDirection) => {
      const target = boxes.find((b) => b.id === id);
      if (!target) return;

      const [part1, part2] =
        direction === 'horizontal'
          ? splitBoxHorizontal(target, target.rect.size.height / 2)
          : splitBoxVertical(target, target.rect.size.width / 2);

      pushBoxes(boxes.filter((b) => b.id !== id).concat([part1, part2]));
      setSelectedBoxIds([part1.id, part2.id]);
    },
    [boxes, pushBoxes],
  );

  const mergeSelectedBoxes = useCallback(() => {
    const selectedBoxes = boxes.filter((b) => selectedBoxIds.includes(b.id));
    const validation = validateMerge(selectedBoxes);
    if (!validation.valid) return;

    const merged = mergeBoxes(selectedBoxes);
    const remaining = boxes.filter((b) => !selectedBoxIds.includes(b.id));
    pushBoxes([...remaining, merged]);
    setSelectedBoxIds([merged.id]);
  }, [boxes, selectedBoxIds, pushBoxes]);

  const deleteSelectedBoxes = useCallback(() => {
    if (selectedBoxIds.length === 0) return;
    pushBoxes(boxes.filter((b) => !selectedBoxIds.includes(b.id)));
    setSelectedBoxIds([]);
  }, [boxes, selectedBoxIds, pushBoxes]);

  const activeGuides: SnapGuideResult = snap?.activeGuides ?? EMPTY_SNAP_GUIDE_RESULT;

  return {
    selectedBoxIds,
    boxes,
    isDragging,
    canUndo,
    canRedo,
    activeGuides,
    actions: {
      selectBox,
      deselectAll,
      toggleBoxSelection,
      moveSelectedBoxes,
      resizeBox,
      updateBox,
      setBoxes: setBoxesAction,
      setDragging: setDraggingAction,
      undo,
      redo,
      splitBox,
      mergeSelectedBoxes,
      deleteSelectedBoxes,
    },
  };
}
