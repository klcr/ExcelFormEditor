import { createBox } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SplitAction } from './SplitAction';

function makeBox(id: string) {
  return createBox({
    id,
    rect: { position: { x: 0, y: 0 }, size: { width: 40, height: 20 } },
  });
}

describe('SplitAction', () => {
  it('renders nothing when 0 boxes selected', () => {
    const { container } = render(<SplitAction selectedBoxIds={[]} boxes={[]} onSplit={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when 2+ boxes selected', () => {
    const boxes = [makeBox('b1'), makeBox('b2')];
    const { container } = render(
      <SplitAction selectedBoxIds={['b1', 'b2']} boxes={boxes} onSplit={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders split buttons when 1 box selected', () => {
    const boxes = [makeBox('b1')];
    render(<SplitAction selectedBoxIds={['b1']} boxes={boxes} onSplit={vi.fn()} />);
    expect(screen.getByTestId('split-horizontal')).toHaveTextContent('水平分割');
    expect(screen.getByTestId('split-vertical')).toHaveTextContent('垂直分割');
  });

  it('clicking horizontal split calls onSplit correctly', () => {
    const onSplit = vi.fn();
    const boxes = [makeBox('b1')];
    render(<SplitAction selectedBoxIds={['b1']} boxes={boxes} onSplit={onSplit} />);
    fireEvent.click(screen.getByTestId('split-horizontal'));
    expect(onSplit).toHaveBeenCalledWith('b1', 'horizontal');
  });

  it('clicking vertical split calls onSplit correctly', () => {
    const onSplit = vi.fn();
    const boxes = [makeBox('b1')];
    render(<SplitAction selectedBoxIds={['b1']} boxes={boxes} onSplit={onSplit} />);
    fireEvent.click(screen.getByTestId('split-vertical'));
    expect(onSplit).toHaveBeenCalledWith('b1', 'vertical');
  });
});
