import type { BoxDefinition } from '@domain/box';
import type { Position } from '@domain/shared';
import { useCallback, useRef } from 'react';
import { findParentSvg, screenToSvgCoords } from '../../../utils/svgCoordinates';

type DragHandleProps = {
  readonly box: BoxDefinition;
  readonly onDragStart: () => void;
  readonly onDrag: (delta: Position) => void;
  readonly onDragEnd: () => void;
  /** ドラッグ中のdeltaをスナップ補正するコールバック（省略可） */
  readonly snapDelta?: (box: BoxDefinition, rawDelta: Position) => Position;
};

export function DragHandle({ box, onDragStart, onDrag, onDragEnd, snapDelta }: DragHandleProps) {
  const { x, y } = box.rect.position;
  const { width, height } = box.rect.size;
  const lastSvgPos = useRef<Position | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const svgElement = findParentSvg(e.currentTarget);
      if (!svgElement) return;

      lastSvgPos.current = screenToSvgCoords(svgElement, e.clientX, e.clientY);
      onDragStart();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!lastSvgPos.current) return;
        const currentPos = screenToSvgCoords(svgElement, moveEvent.clientX, moveEvent.clientY);
        const delta: Position = {
          x: currentPos.x - lastSvgPos.current.x,
          y: currentPos.y - lastSvgPos.current.y,
        };
        lastSvgPos.current = currentPos;
        const correctedDelta = snapDelta ? snapDelta(box, delta) : delta;
        onDrag(correctedDelta);
      };

      const handleMouseUp = () => {
        lastSvgPos.current = null;
        onDragEnd();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onDragStart, onDrag, onDragEnd, snapDelta, box],
  );

  return (
    <rect
      data-testid={`drag-handle-${box.id}`}
      x={x}
      y={y}
      width={width}
      height={height}
      fill="transparent"
      style={{ cursor: 'move' }}
      onMouseDown={handleMouseDown}
    />
  );
}
