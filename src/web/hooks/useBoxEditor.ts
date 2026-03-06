import type { BoxDefinition } from '@domain/box';
import type { Position, Size } from '@domain/shared';
import { useCallback, useState } from 'react';

/** Minimum box size in mm */
const MIN_BOX_WIDTH = 2;
const MIN_BOX_HEIGHT = 2;

type BoxEditorActions = {
  readonly selectBox: (id: string) => void;
  readonly deselectAll: () => void;
  readonly toggleBoxSelection: (id: string) => void;
  readonly moveSelectedBoxes: (delta: Position) => void;
  readonly resizeBox: (id: string, newSize: Size) => void;
  readonly setBoxes: (boxes: readonly BoxDefinition[]) => void;
  readonly setDragging: (isDragging: boolean) => void;
};

type UseBoxEditorReturn = {
  readonly selectedBoxIds: readonly string[];
  readonly boxes: readonly BoxDefinition[];
  readonly isDragging: boolean;
  readonly actions: BoxEditorActions;
};

export function useBoxEditor(initialBoxes: readonly BoxDefinition[] = []): UseBoxEditorReturn {
  const [selectedBoxIds, setSelectedBoxIds] = useState<readonly string[]>([]);
  const [boxes, setBoxes] = useState<readonly BoxDefinition[]>(initialBoxes);
  const [isDragging, setDragging] = useState(false);

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
      setBoxes((prev) =>
        prev.map((box) => {
          if (!selectedBoxIds.includes(box.id)) return box;
          return {
            ...box,
            rect: {
              ...box.rect,
              position: {
                x: box.rect.position.x + delta.x,
                y: box.rect.position.y + delta.y,
              },
            },
          };
        }),
      );
    },
    [selectedBoxIds],
  );

  const resizeBox = useCallback((id: string, newSize: Size) => {
    const clampedSize: Size = {
      width: Math.max(newSize.width, MIN_BOX_WIDTH),
      height: Math.max(newSize.height, MIN_BOX_HEIGHT),
    };
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id !== id) return box;
        return {
          ...box,
          rect: {
            ...box.rect,
            size: clampedSize,
          },
        };
      }),
    );
  }, []);

  const setBoxesAction = useCallback((newBoxes: readonly BoxDefinition[]) => {
    setBoxes(newBoxes);
  }, []);

  const setDraggingAction = useCallback((dragging: boolean) => {
    setDragging(dragging);
  }, []);

  return {
    selectedBoxIds,
    boxes,
    isDragging,
    actions: {
      selectBox,
      deselectAll,
      toggleBoxSelection,
      moveSelectedBoxes,
      resizeBox,
      setBoxes: setBoxesAction,
      setDragging: setDraggingAction,
    },
  };
}
