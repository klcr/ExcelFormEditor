import { createBox } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BoxOverlay } from './BoxOverlay';

function makeBox(id = 'box-1') {
  return createBox({
    id,
    rect: { position: { x: 10, y: 20 }, size: { width: 50, height: 30 } },
  });
}

function renderOverlay(props?: { isSelected?: boolean; onSelect?: ReturnType<typeof vi.fn> }) {
  const box = makeBox();
  const onSelect = props?.onSelect ?? vi.fn();
  const { container } = render(
    <svg role="img" aria-label="test">
      <BoxOverlay box={box} isSelected={props?.isSelected ?? false} onSelect={onSelect} />
    </svg>,
  );
  return { box, onSelect, container };
}

describe('BoxOverlay', () => {
  it('renders a rect overlay with correct position and size', () => {
    renderOverlay();
    const overlay = screen.getByTestId('box-overlay-box-1');
    expect(overlay).toHaveAttribute('x', '10');
    expect(overlay).toHaveAttribute('y', '20');
    expect(overlay).toHaveAttribute('width', '50');
    expect(overlay).toHaveAttribute('height', '30');
  });

  it('shows blue stroke when selected', () => {
    renderOverlay({ isSelected: true });
    const overlay = screen.getByTestId('box-overlay-box-1');
    expect(overlay).toHaveAttribute('stroke', '#2196F3');
  });

  it('shows transparent stroke when not selected', () => {
    renderOverlay({ isSelected: false });
    const overlay = screen.getByTestId('box-overlay-box-1');
    expect(overlay).toHaveAttribute('stroke', 'transparent');
  });

  it('calls onSelect with box id on click', () => {
    const onSelect = vi.fn();
    renderOverlay({ onSelect });
    fireEvent.click(screen.getByTestId('box-overlay-box-1'));
    expect(onSelect).toHaveBeenCalledWith('box-1', false);
  });

  it('calls onSelect with multiSelect=true when ctrl-click', () => {
    const onSelect = vi.fn();
    renderOverlay({ onSelect });
    fireEvent.click(screen.getByTestId('box-overlay-box-1'), { ctrlKey: true });
    expect(onSelect).toHaveBeenCalledWith('box-1', true);
  });

  it('calls onSelect with multiSelect=true when meta-click', () => {
    const onSelect = vi.fn();
    renderOverlay({ onSelect });
    fireEvent.click(screen.getByTestId('box-overlay-box-1'), { metaKey: true });
    expect(onSelect).toHaveBeenCalledWith('box-1', true);
  });
});
