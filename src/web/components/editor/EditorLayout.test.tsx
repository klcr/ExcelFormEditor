import { createBox } from '@domain/box';
import type { PaperDefinition } from '@domain/paper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorLayout } from './EditorLayout';

function makeBox(id: string, x = 10, y = 20, width = 50, height = 30) {
  return createBox({
    id,
    rect: { position: { x, y }, size: { width, height } },
  });
}

const defaultPaper: PaperDefinition = {
  size: 'A4',
  orientation: 'portrait',
  margins: { top: 1.0, bottom: 1.0, left: 0.75, right: 0.75, header: 0.3, footer: 0.3 },
  scaling: { mode: 'scale', percent: 100 },
  printableArea: { width: 170, height: 257 },
  centering: { horizontal: false, vertical: false },
};

describe('EditorLayout', () => {
  it('ボックスを含むエディタを描画する', () => {
    const boxes = [makeBox('box-1'), makeBox('box-2', 80, 90, 40, 25)];
    render(<EditorLayout boxes={boxes} paper={defaultPaper} />);
    expect(screen.getByTestId('editor-layout')).toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('box-overlay-box-1')).toBeInTheDocument();
    expect(screen.getByTestId('box-overlay-box-2')).toBeInTheDocument();
  });

  it('Undo/Redo ボタンが存在し canUndo/canRedo 状態を反映する', () => {
    const boxes = [makeBox('box-1')];
    render(<EditorLayout boxes={boxes} paper={defaultPaper} />);
    const undoButton = screen.getByTestId('undo-button');
    const redoButton = screen.getByTestId('redo-button');
    expect(undoButton).toBeInTheDocument();
    expect(redoButton).toBeInTheDocument();
    // Initial state: no undo/redo history
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
  });

  it('PropertyPanel がボックス選択可能な状態で表示される', () => {
    const boxes = [makeBox('box-1')];
    render(<EditorLayout boxes={boxes} paper={defaultPaper} />);
    // PropertyPanel shows empty state when no box selected
    expect(screen.getByText('ボックスを選択してください')).toBeInTheDocument();
  });

  it('paper が null のときデフォルトサイズで描画する', () => {
    render(<EditorLayout boxes={[]} paper={null} />);
    const canvas = screen.getByTestId('editor-canvas');
    expect(canvas).toHaveAttribute('viewBox', '0 0 210 297');
  });

  it('ツールバーが表示される', () => {
    render(<EditorLayout boxes={[]} paper={defaultPaper} />);
    expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
  });
});

describe('EditorLayout mobile', () => {
  it('mobile レイアウトでエディタを描画する', () => {
    render(<EditorLayout boxes={[makeBox('box-1')]} paper={defaultPaper} layoutMode="mobile" />);
    expect(screen.getByTestId('editor-layout')).toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
  });

  it('mobile でボックス未選択時はプロパティボタン非表示', () => {
    render(<EditorLayout boxes={[makeBox('box-1')]} paper={defaultPaper} layoutMode="mobile" />);
    expect(screen.queryByTestId('open-property-sheet')).not.toBeInTheDocument();
  });

  it('mobile でツールバーが表示される', () => {
    render(<EditorLayout boxes={[]} paper={defaultPaper} layoutMode="mobile" />);
    expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
  });
});
