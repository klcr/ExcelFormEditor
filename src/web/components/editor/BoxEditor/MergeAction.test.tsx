import { createBox } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MergeAction } from './MergeAction';

function makeBox(id: string, x: number, y: number, width: number, height: number) {
  return createBox({
    id,
    rect: { position: { x, y }, size: { width, height } },
  });
}

describe('MergeAction', () => {
  it('renders nothing when fewer than 2 boxes selected', () => {
    const boxes = [makeBox('b1', 0, 0, 20, 10)];
    const { container } = render(
      <MergeAction selectedBoxIds={[]} boxes={boxes} onMerge={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when 1 box selected', () => {
    const boxes = [makeBox('b1', 0, 0, 20, 10)];
    const { container } = render(
      <MergeAction selectedBoxIds={['b1']} boxes={boxes} onMerge={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders disabled button when boxes cannot merge', () => {
    // Non-adjacent boxes with gap - bounding box area > sum of areas
    const boxes = [makeBox('b1', 0, 0, 10, 10), makeBox('b2', 20, 0, 10, 10)];
    render(<MergeAction selectedBoxIds={['b1', 'b2']} boxes={boxes} onMerge={vi.fn()} />);
    const button = screen.getByTestId('merge-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('結合');
  });

  it('renders enabled button when boxes can merge', () => {
    // Adjacent boxes that tile perfectly
    const boxes = [makeBox('b1', 0, 0, 10, 10), makeBox('b2', 10, 0, 10, 10)];
    render(<MergeAction selectedBoxIds={['b1', 'b2']} boxes={boxes} onMerge={vi.fn()} />);
    const button = screen.getByTestId('merge-button');
    expect(button).not.toBeDisabled();
  });

  it('clicking calls onMerge', () => {
    const onMerge = vi.fn();
    const boxes = [makeBox('b1', 0, 0, 10, 10), makeBox('b2', 10, 0, 10, 10)];
    render(<MergeAction selectedBoxIds={['b1', 'b2']} boxes={boxes} onMerge={onMerge} />);
    fireEvent.click(screen.getByTestId('merge-button'));
    expect(onMerge).toHaveBeenCalledOnce();
  });
});
