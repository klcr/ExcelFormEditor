import { createBox } from '@domain/box';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PropertyPanel } from './PropertyPanel';

function makeBox(id = 'box-1') {
  return createBox({
    id,
    rect: { position: { x: 10, y: 20 }, size: { width: 50, height: 30 } },
  });
}

const noop = vi.fn();

describe('PropertyPanel', () => {
  it('shows empty state message when no box is selected', () => {
    render(<PropertyPanel selectedBoxIds={[]} boxes={[makeBox()]} onMove={noop} onResize={noop} />);
    expect(screen.getByText('ボックスを選択してください')).toBeInTheDocument();
  });

  it('shows PositionSizeSection when 1 box is selected', () => {
    const box = makeBox();
    render(
      <PropertyPanel selectedBoxIds={['box-1']} boxes={[box]} onMove={noop} onResize={noop} />,
    );
    expect(screen.getByLabelText('X位置')).toBeInTheDocument();
    expect(screen.getByLabelText('Y位置')).toBeInTheDocument();
    expect(screen.getByLabelText('幅')).toBeInTheDocument();
    expect(screen.getByLabelText('高さ')).toBeInTheDocument();
  });

  it('shows multi-select message when 2+ boxes are selected', () => {
    const boxes = [makeBox('box-1'), makeBox('box-2')];
    render(
      <PropertyPanel
        selectedBoxIds={['box-1', 'box-2']}
        boxes={boxes}
        onMove={noop}
        onResize={noop}
      />,
    );
    expect(screen.getByText('2個のボックスを選択中')).toBeInTheDocument();
  });
});
