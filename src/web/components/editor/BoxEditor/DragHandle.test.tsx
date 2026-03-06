import { createBox } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DragHandle } from './DragHandle';

function makeBox(id = 'box-1') {
  return createBox({
    id,
    rect: { position: { x: 10, y: 20 }, size: { width: 50, height: 30 } },
  });
}

/**
 * Mocks SVG APIs (createSVGPoint, getScreenCTM) that are not available in jsdom.
 * Returns an identity transform so screen coords pass through as SVG coords.
 */
function mockSvgApis(svgElement: SVGSVGElement) {
  const mockPoint = { x: 0, y: 0, matrixTransform: vi.fn() };
  mockPoint.matrixTransform.mockImplementation(() => ({ x: mockPoint.x, y: mockPoint.y }));

  svgElement.createSVGPoint = vi.fn(() => mockPoint as unknown as SVGPoint);
  svgElement.getScreenCTM = vi.fn(() => ({ inverse: () => ({}) }) as unknown as DOMMatrix);

  return mockPoint;
}

describe('DragHandle', () => {
  let svgElement: SVGSVGElement;
  let mockPoint: ReturnType<typeof mockSvgApis>;

  function renderHandle(overrides?: {
    onDragStart?: ReturnType<typeof vi.fn>;
    onDrag?: ReturnType<typeof vi.fn>;
    onDragEnd?: ReturnType<typeof vi.fn>;
  }) {
    const box = makeBox();
    const onDragStart = overrides?.onDragStart ?? vi.fn();
    const onDrag = overrides?.onDrag ?? vi.fn();
    const onDragEnd = overrides?.onDragEnd ?? vi.fn();

    const { container } = render(
      <svg role="img" aria-label="test">
        <DragHandle box={box} onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      </svg>,
    );
    svgElement = container.querySelector('svg') as SVGSVGElement;
    mockPoint = mockSvgApis(svgElement);

    return { box, onDragStart, onDrag, onDragEnd };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a transparent rect covering the box area', () => {
    renderHandle();
    const handle = screen.getByTestId('drag-handle-box-1');
    expect(handle).toHaveAttribute('x', '10');
    expect(handle).toHaveAttribute('y', '20');
    expect(handle).toHaveAttribute('width', '50');
    expect(handle).toHaveAttribute('height', '30');
    expect(handle).toHaveAttribute('fill', 'transparent');
  });

  it('calls onDragStart on mousedown', () => {
    const onDragStart = vi.fn();
    renderHandle({ onDragStart });

    fireEvent.mouseDown(screen.getByTestId('drag-handle-box-1'), {
      clientX: 100,
      clientY: 200,
    });
    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('calls onDragEnd on mouseup after mousedown', () => {
    const onDragEnd = vi.fn();
    renderHandle({ onDragEnd });

    fireEvent.mouseDown(screen.getByTestId('drag-handle-box-1'), {
      clientX: 100,
      clientY: 200,
    });
    fireEvent.mouseUp(document);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onDrag with delta during mousemove', () => {
    const onDrag = vi.fn();
    renderHandle({ onDrag });

    mockPoint.x = 100;
    mockPoint.y = 200;
    fireEvent.mouseDown(screen.getByTestId('drag-handle-box-1'), {
      clientX: 100,
      clientY: 200,
    });

    mockPoint.x = 110;
    mockPoint.y = 205;
    fireEvent.mouseMove(document, { clientX: 110, clientY: 205 });

    expect(onDrag).toHaveBeenCalledWith({ x: 10, y: 5 });

    fireEvent.mouseUp(document);
  });

  it('does not call onDrag after mouseup', () => {
    const onDrag = vi.fn();
    renderHandle({ onDrag });

    mockPoint.x = 100;
    mockPoint.y = 200;
    fireEvent.mouseDown(screen.getByTestId('drag-handle-box-1'), {
      clientX: 100,
      clientY: 200,
    });

    fireEvent.mouseUp(document);
    onDrag.mockClear();

    fireEvent.mouseMove(document, { clientX: 150, clientY: 250 });
    expect(onDrag).not.toHaveBeenCalled();
  });
});
