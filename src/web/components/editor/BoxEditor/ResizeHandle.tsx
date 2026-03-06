import type { BoxDefinition } from '@domain/box';
import type { Position, Size } from '@domain/shared';
import { useCallback, useRef } from 'react';

type ResizeHandleProps = {
  readonly box: BoxDefinition;
  readonly onResizeStart: () => void;
  readonly onResize: (newSize: Size) => void;
  readonly onResizeEnd: () => void;
};

/** Handle positions: corners + midpoints */
type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLE_SIZE = 1.5;
const MIN_SIZE = 2;

type HandleConfig = {
  readonly position: HandlePosition;
  readonly cursor: string;
  readonly getOffset: (
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number,
  ) => { cx: number; cy: number };
  readonly applyDelta: (origSize: Size, dx: number, dy: number) => Size;
};

const HANDLE_CONFIGS: readonly HandleConfig[] = [
  {
    position: 'nw',
    cursor: 'nwse-resize',
    getOffset: (x, y) => ({ cx: x, cy: y }),
    applyDelta: (s, dx, dy) => ({
      width: Math.max(s.width - dx, MIN_SIZE),
      height: Math.max(s.height - dy, MIN_SIZE),
    }),
  },
  {
    position: 'n',
    cursor: 'ns-resize',
    getOffset: (x, y, w) => ({ cx: x + w / 2, cy: y }),
    applyDelta: (s, _dx, dy) => ({
      width: s.width,
      height: Math.max(s.height - dy, MIN_SIZE),
    }),
  },
  {
    position: 'ne',
    cursor: 'nesw-resize',
    getOffset: (x, y, w) => ({ cx: x + w, cy: y }),
    applyDelta: (s, dx, dy) => ({
      width: Math.max(s.width + dx, MIN_SIZE),
      height: Math.max(s.height - dy, MIN_SIZE),
    }),
  },
  {
    position: 'e',
    cursor: 'ew-resize',
    getOffset: (x, y, w, h) => ({ cx: x + w, cy: y + h / 2 }),
    applyDelta: (s, dx) => ({
      width: Math.max(s.width + dx, MIN_SIZE),
      height: s.height,
    }),
  },
  {
    position: 'se',
    cursor: 'nwse-resize',
    getOffset: (x, y, w, h) => ({ cx: x + w, cy: y + h }),
    applyDelta: (s, dx, dy) => ({
      width: Math.max(s.width + dx, MIN_SIZE),
      height: Math.max(s.height + dy, MIN_SIZE),
    }),
  },
  {
    position: 's',
    cursor: 'ns-resize',
    getOffset: (x, y, w, h) => ({ cx: x + w / 2, cy: y + h }),
    applyDelta: (s, _dx, dy) => ({
      width: s.width,
      height: Math.max(s.height + dy, MIN_SIZE),
    }),
  },
  {
    position: 'sw',
    cursor: 'nesw-resize',
    getOffset: (x, y, _w, h) => ({ cx: x, cy: y + h }),
    applyDelta: (s, dx, dy) => ({
      width: Math.max(s.width - dx, MIN_SIZE),
      height: Math.max(s.height + dy, MIN_SIZE),
    }),
  },
  {
    position: 'w',
    cursor: 'ew-resize',
    getOffset: (x, y, _w, h) => ({ cx: x, cy: y + h / 2 }),
    applyDelta: (s, dx) => ({
      width: Math.max(s.width - dx, MIN_SIZE),
      height: s.height,
    }),
  },
];

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

export function ResizeHandle({ box, onResizeStart, onResize, onResizeEnd }: ResizeHandleProps) {
  const { x, y } = box.rect.position;
  const { width, height } = box.rect.size;
  const lastSvgPos = useRef<Position | null>(null);

  const handleMouseDown = useCallback(
    (config: HandleConfig) => (e: React.MouseEvent<SVGRectElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const svgElement = findParentSvg(e.currentTarget);
      if (!svgElement) return;

      lastSvgPos.current = screenToSvgCoords(svgElement, e.clientX, e.clientY);
      const origSize: Size = { width: box.rect.size.width, height: box.rect.size.height };
      let accumulatedDx = 0;
      let accumulatedDy = 0;

      onResizeStart();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!lastSvgPos.current) return;
        const currentPos = screenToSvgCoords(svgElement, moveEvent.clientX, moveEvent.clientY);
        const dx = currentPos.x - lastSvgPos.current.x;
        const dy = currentPos.y - lastSvgPos.current.y;
        accumulatedDx += dx;
        accumulatedDy += dy;
        lastSvgPos.current = currentPos;

        const newSize = config.applyDelta(origSize, accumulatedDx, accumulatedDy);
        onResize(newSize);
      };

      const handleMouseUp = () => {
        lastSvgPos.current = null;
        onResizeEnd();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [box.rect.size.width, box.rect.size.height, onResizeStart, onResize, onResizeEnd],
  );

  return (
    <g data-testid={`resize-handles-${box.id}`}>
      {HANDLE_CONFIGS.map((config) => {
        const { cx, cy } = config.getOffset(x, y, width, height);
        return (
          <rect
            key={config.position}
            data-testid={`resize-handle-${config.position}`}
            x={cx - HANDLE_SIZE / 2}
            y={cy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="white"
            stroke="#2196F3"
            strokeWidth={0.3}
            style={{ cursor: config.cursor }}
            onMouseDown={handleMouseDown(config)}
          />
        );
      })}
    </g>
  );
}
