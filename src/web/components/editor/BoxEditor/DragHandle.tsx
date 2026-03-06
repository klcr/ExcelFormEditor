import type { BoxDefinition } from '@domain/box';
import type { Position } from '@domain/shared';
import { useCallback, useRef } from 'react';

type DragHandleProps = {
  readonly box: BoxDefinition;
  readonly onDragStart: () => void;
  readonly onDrag: (delta: Position) => void;
  readonly onDragEnd: () => void;
};

/**
 * Converts screen (client) coordinates to SVG coordinates.
 * Requires the SVG element to have a viewBox set.
 */
function screenToSvgCoords(svgElement: SVGSVGElement, clientX: number, clientY: number): Position {
  const point = svgElement.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = svgElement.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const svgPoint = point.matrixTransform(ctm.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

function findParentSvg(element: Element): SVGSVGElement | null {
  let current: Element | null = element;
  while (current) {
    if (current instanceof SVGSVGElement) return current;
    current = current.parentElement;
  }
  return null;
}

export function DragHandle({ box, onDragStart, onDrag, onDragEnd }: DragHandleProps) {
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
        onDrag(delta);
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
    [onDragStart, onDrag, onDragEnd],
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
