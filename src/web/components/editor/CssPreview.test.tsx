import { createBox } from '@domain/box';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CssPreview } from './CssPreview';

function makeBox(id: string) {
  return createBox({
    id,
    rect: { position: { x: 10, y: 20 }, size: { width: 100, height: 30 } },
    border: { top: { style: 'thin', color: '000000' } },
  });
}

describe('CssPreview', () => {
  it('ボックスが選択されていないとき案内メッセージを表示する', () => {
    render(<CssPreview boxes={[makeBox('b1')]} selectedBoxIds={[]} />);
    expect(screen.getByText('ボックスを1つ選択してCSSを表示')).toBeInTheDocument();
  });

  it('複数ボックスが選択されているとき案内メッセージを表示する', () => {
    const boxes = [makeBox('b1'), makeBox('b2')];
    render(<CssPreview boxes={boxes} selectedBoxIds={['b1', 'b2']} />);
    expect(screen.getByText('ボックスを1つ選択してCSSを表示')).toBeInTheDocument();
  });

  it('1つのボックスが選択されているとき CSS を表示する', () => {
    const boxes = [makeBox('b1')];
    render(<CssPreview boxes={boxes} selectedBoxIds={['b1']} />);
    expect(screen.getByText(/position: absolute/)).toBeInTheDocument();
    expect(screen.getByText(/border-top:/)).toBeInTheDocument();
  });

  it('コピーボタンが表示される', () => {
    const boxes = [makeBox('b1')];
    render(<CssPreview boxes={boxes} selectedBoxIds={['b1']} />);
    expect(screen.getByText('コピー')).toBeInTheDocument();
  });
});
