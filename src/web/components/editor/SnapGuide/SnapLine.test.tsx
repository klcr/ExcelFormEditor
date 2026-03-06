import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SnapLine } from './SnapLine';

function renderInSvg(ui: React.ReactElement) {
  return render(
    <svg>
      <title>test</title>
      {ui}
    </svg>,
  );
}

describe('SnapLine', () => {
  it('X ガイドで垂直線を描画する', () => {
    const guides = {
      x: [{ value: 100, sourceBoxId: 'b1', edge: 'left' as const }],
      y: [],
    };
    renderInSvg(<SnapLine guides={guides} viewBoxWidth={300} viewBoxHeight={400} />);

    const lines = screen.getAllByTestId('snap-guide-vertical');
    expect(lines).toHaveLength(1);
    const line = lines[0] as HTMLElement;
    expect(line.getAttribute('x1')).toBe('100');
    expect(line.getAttribute('y2')).toBe('400');
  });

  it('Y ガイドで水平線を描画する', () => {
    const guides = {
      x: [],
      y: [{ value: 50, sourceBoxId: 'b2', edge: 'top' as const }],
    };
    renderInSvg(<SnapLine guides={guides} viewBoxWidth={300} viewBoxHeight={400} />);

    const lines = screen.getAllByTestId('snap-guide-horizontal');
    expect(lines).toHaveLength(1);
    const line = lines[0] as HTMLElement;
    expect(line.getAttribute('y1')).toBe('50');
    expect(line.getAttribute('x2')).toBe('300');
  });

  it('ガイドが空の場合は何も描画しない', () => {
    const { container } = renderInSvg(
      <SnapLine guides={{ x: [], y: [] }} viewBoxWidth={300} viewBoxHeight={400} />,
    );
    expect(container.querySelector('[data-testid="snap-guides"]')).toBeNull();
  });

  it('複数のガイド線を描画する', () => {
    const guides = {
      x: [
        { value: 100, sourceBoxId: 'b1', edge: 'left' as const },
        { value: 200, sourceBoxId: 'b2', edge: 'right' as const },
      ],
      y: [{ value: 50, sourceBoxId: 'b3', edge: 'top' as const }],
    };
    renderInSvg(<SnapLine guides={guides} viewBoxWidth={300} viewBoxHeight={400} />);

    expect(screen.getAllByTestId('snap-guide-vertical')).toHaveLength(2);
    expect(screen.getAllByTestId('snap-guide-horizontal')).toHaveLength(1);
  });
});
