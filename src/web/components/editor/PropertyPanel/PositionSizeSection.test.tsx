import { createBox } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PositionSizeSection } from './PositionSizeSection';

function makeBox() {
  return createBox({
    id: 'box-1',
    rect: { position: { x: 10.55, y: 20.44 }, size: { width: 50.67, height: 30.12 } },
  });
}

describe('PositionSizeSection', () => {
  it('renders current position and size values rounded to 1 decimal', () => {
    const box = makeBox();
    render(<PositionSizeSection box={box} onPositionChange={vi.fn()} onSizeChange={vi.fn()} />);

    expect(screen.getByLabelText('X位置')).toHaveValue(10.6);
    expect(screen.getByLabelText('Y位置')).toHaveValue(20.4);
    expect(screen.getByLabelText('幅')).toHaveValue(50.7);
    expect(screen.getByLabelText('高さ')).toHaveValue(30.1);
  });

  it('calls onPositionChange when X input changes', () => {
    const box = makeBox();
    const onPositionChange = vi.fn();
    render(
      <PositionSizeSection box={box} onPositionChange={onPositionChange} onSizeChange={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText('X位置'), { target: { value: '15' } });
    expect(onPositionChange).toHaveBeenCalledWith({ x: 15, y: 20.44 });
  });

  it('calls onSizeChange when width input changes', () => {
    const box = makeBox();
    const onSizeChange = vi.fn();
    render(
      <PositionSizeSection box={box} onPositionChange={vi.fn()} onSizeChange={onSizeChange} />,
    );

    fireEvent.change(screen.getByLabelText('幅'), { target: { value: '60' } });
    expect(onSizeChange).toHaveBeenCalledWith({ width: 60, height: 30.12 });
  });
});
