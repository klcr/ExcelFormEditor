import { createBox } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResizeHandle } from './ResizeHandle';

function makeBox(id = 'box-1', width = 50, height = 30) {
  return createBox({
    id,
    rect: { position: { x: 10, y: 20 }, size: { width, height } },
  });
}

/**
 * Mocks SVG APIs (createSVGPoint, getScreenCTM) that are not available in jsdom.
 */
function mockSvgApis(svgElement: SVGSVGElement) {
  const mockPoint = { x: 0, y: 0, matrixTransform: vi.fn() };
  mockPoint.matrixTransform.mockImplementation(() => ({ x: mockPoint.x, y: mockPoint.y }));

  svgElement.createSVGPoint = vi.fn(() => mockPoint as unknown as SVGPoint);
  svgElement.getScreenCTM = vi.fn(() => ({ inverse: () => ({}) }) as unknown as DOMMatrix);

  return mockPoint;
}

const HANDLE_POSITIONS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

describe('ResizeHandle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderHandles(overrides?: {
    box?: ReturnType<typeof makeBox>;
    onResizeStart?: ReturnType<typeof vi.fn>;
    onResize?: ReturnType<typeof vi.fn>;
    onResizeEnd?: ReturnType<typeof vi.fn>;
  }) {
    const box = overrides?.box ?? makeBox();
    const onResizeStart = overrides?.onResizeStart ?? vi.fn();
    const onResize = overrides?.onResize ?? vi.fn();
    const onResizeEnd = overrides?.onResizeEnd ?? vi.fn();

    const { container } = render(
      <svg role="img" aria-label="test">
        <ResizeHandle
          box={box}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
      </svg>,
    );
    const svgElement = container.querySelector('svg') as SVGSVGElement;
    const mockPoint = mockSvgApis(svgElement);

    return { box, onResizeStart, onResize, onResizeEnd, mockPoint };
  }

  it('renders 8 resize handle rects', () => {
    renderHandles();
    const group = screen.getByTestId('resize-handles-box-1');
    expect(group).toBeInTheDocument();

    for (const pos of HANDLE_POSITIONS) {
      expect(screen.getByTestId(`resize-handle-${pos}`)).toBeInTheDocument();
    }
  });

  it('renders handles with white fill and blue stroke', () => {
    renderHandles();
    const handle = screen.getByTestId('resize-handle-se');
    expect(handle).toHaveAttribute('fill', 'white');
    expect(handle).toHaveAttribute('stroke', '#2196F3');
  });

  it('calls onResizeStart on mousedown on a handle', () => {
    const onResizeStart = vi.fn();
    renderHandles({ onResizeStart });

    fireEvent.mouseDown(screen.getByTestId('resize-handle-se'), {
      clientX: 100,
      clientY: 200,
    });
    expect(onResizeStart).toHaveBeenCalledTimes(1);
  });

  it('calls onResizeEnd on mouseup after mousedown', () => {
    const onResizeEnd = vi.fn();
    renderHandles({ onResizeEnd });

    fireEvent.mouseDown(screen.getByTestId('resize-handle-se'), {
      clientX: 100,
      clientY: 200,
    });
    fireEvent.mouseUp(document);
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onResize with new size during SE drag', () => {
    const onResize = vi.fn();
    const { mockPoint } = renderHandles({ onResize });

    mockPoint.x = 60;
    mockPoint.y = 50;
    fireEvent.mouseDown(screen.getByTestId('resize-handle-se'), {
      clientX: 60,
      clientY: 50,
    });

    // Drag SE handle 10px right and 5px down -> width+10, height+5
    mockPoint.x = 70;
    mockPoint.y = 55;
    fireEvent.mouseMove(document, { clientX: 70, clientY: 55 });

    expect(onResize).toHaveBeenCalledWith({ width: 60, height: 35 });

    fireEvent.mouseUp(document);
  });

  it('enforces minimum size of 2mm', () => {
    const onResize = vi.fn();
    const box = makeBox('box-1', 10, 10);
    const { mockPoint } = renderHandles({ onResize, box });

    mockPoint.x = 20;
    mockPoint.y = 30;
    fireEvent.mouseDown(screen.getByTestId('resize-handle-se'), {
      clientX: 20,
      clientY: 30,
    });

    // Drag far negative to try to make size < MIN_SIZE
    mockPoint.x = -100;
    mockPoint.y = -100;
    fireEvent.mouseMove(document, { clientX: -100, clientY: -100 });

    expect(onResize).toHaveBeenCalled();
    const lastCall = onResize.mock.calls.at(-1)?.[0];
    expect(lastCall.width).toBeGreaterThanOrEqual(2);
    expect(lastCall.height).toBeGreaterThanOrEqual(2);

    fireEvent.mouseUp(document);
  });

  it('does not call onResize after mouseup', () => {
    const onResize = vi.fn();
    const { mockPoint } = renderHandles({ onResize });

    mockPoint.x = 60;
    mockPoint.y = 50;
    fireEvent.mouseDown(screen.getByTestId('resize-handle-se'), {
      clientX: 60,
      clientY: 50,
    });

    fireEvent.mouseUp(document);
    onResize.mockClear();

    fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });
    expect(onResize).not.toHaveBeenCalled();
  });
});
