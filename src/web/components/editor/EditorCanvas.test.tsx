import { createBox } from '@domain/box';
import type { SnapGuideResult } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorCanvas } from './EditorCanvas';

function makeBox(id: string, x = 10, y = 20, width = 50, height = 30) {
  return createBox({
    id,
    rect: { position: { x, y }, size: { width, height } },
  });
}

const EMPTY_GUIDES: SnapGuideResult = { x: [], y: [] };

const NON_EMPTY_GUIDES: SnapGuideResult = {
  x: [{ value: 100, sourceBoxId: 'b2', edge: 'left' as const }],
  y: [{ value: 50, sourceBoxId: 'b3', edge: 'top' as const }],
};

function renderCanvas(overrides?: {
  boxes?: ReturnType<typeof makeBox>[];
  selectedBoxIds?: string[];
  isDragging?: boolean;
  activeGuides?: SnapGuideResult;
  onSelectBox?: ReturnType<typeof vi.fn>;
  onToggleBoxSelection?: ReturnType<typeof vi.fn>;
  onDeselectAll?: ReturnType<typeof vi.fn>;
}) {
  const props = {
    boxes: overrides?.boxes ?? [makeBox('box-1'), makeBox('box-2', 80, 90, 40, 25)],
    selectedBoxIds: overrides?.selectedBoxIds ?? [],
    isDragging: overrides?.isDragging ?? false,
    activeGuides: overrides?.activeGuides ?? EMPTY_GUIDES,
    onSelectBox: overrides?.onSelectBox ?? vi.fn(),
    onToggleBoxSelection: overrides?.onToggleBoxSelection ?? vi.fn(),
    onDeselectAll: overrides?.onDeselectAll ?? vi.fn(),
    paperWidth: 210,
    paperHeight: 297,
  };
  return { ...render(<EditorCanvas {...props} />), props };
}

describe('EditorCanvas', () => {
  it('ボックスを SVG rect として描画する', () => {
    renderCanvas();
    expect(screen.getByTestId('box-overlay-box-1')).toBeInTheDocument();
    expect(screen.getByTestId('box-overlay-box-2')).toBeInTheDocument();
  });

  it('ボックスクリックで onSelectBox を呼ぶ', () => {
    const onSelectBox = vi.fn();
    renderCanvas({ onSelectBox });
    fireEvent.click(screen.getByTestId('box-overlay-box-1'));
    expect(onSelectBox).toHaveBeenCalledWith('box-1');
  });

  it('背景クリックで onDeselectAll を呼ぶ', () => {
    const onDeselectAll = vi.fn();
    renderCanvas({ onDeselectAll });
    fireEvent.click(screen.getByTestId('editor-canvas-background'));
    expect(onDeselectAll).toHaveBeenCalled();
  });

  it('isDragging=true かつガイドがあるとき SnapLine を描画する', () => {
    renderCanvas({ isDragging: true, activeGuides: NON_EMPTY_GUIDES });
    expect(screen.getByTestId('snap-guides')).toBeInTheDocument();
    expect(screen.getAllByTestId('snap-guide-vertical')).toHaveLength(1);
    expect(screen.getAllByTestId('snap-guide-horizontal')).toHaveLength(1);
  });

  it('isDragging=false のとき SnapLine を描画しない', () => {
    renderCanvas({ isDragging: false, activeGuides: NON_EMPTY_GUIDES });
    expect(screen.queryByTestId('snap-guides')).toBeNull();
  });

  it('ガイドが空のとき SnapLine を描画しない', () => {
    renderCanvas({ isDragging: true, activeGuides: EMPTY_GUIDES });
    expect(screen.queryByTestId('snap-guides')).toBeNull();
  });

  it('選択状態のボックスがハイライトされる', () => {
    renderCanvas({ selectedBoxIds: ['box-1'] });
    const overlay = screen.getByTestId('box-overlay-box-1');
    expect(overlay).toHaveAttribute('stroke', '#2196F3');
    const overlay2 = screen.getByTestId('box-overlay-box-2');
    expect(overlay2).toHaveAttribute('stroke', 'transparent');
  });

  it('Ctrl+クリックで onToggleBoxSelection を呼ぶ', () => {
    const onToggleBoxSelection = vi.fn();
    const onSelectBox = vi.fn();
    renderCanvas({ onSelectBox, onToggleBoxSelection });
    fireEvent.click(screen.getByTestId('box-overlay-box-1'), { ctrlKey: true });
    expect(onToggleBoxSelection).toHaveBeenCalledWith('box-1');
    expect(onSelectBox).not.toHaveBeenCalled();
  });

  it('viewBox が用紙サイズに一致する', () => {
    renderCanvas();
    const svg = screen.getByTestId('editor-canvas');
    expect(svg).toHaveAttribute('viewBox', '0 0 210 297');
  });
});
