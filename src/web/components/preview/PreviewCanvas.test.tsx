import { createPaperDefinition } from '@domain/paper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PreviewCanvas } from './PreviewCanvas';

function getDefaultPaper() {
  const result = createPaperDefinition({
    size: 'A4',
    orientation: 'portrait',
  });
  if (!result.ok) {
    throw new Error('Failed to create paper definition');
  }
  return result.paper;
}

describe('PreviewCanvas', () => {
  it('shows empty state message when paper is null', () => {
    render(<PreviewCanvas paper={null} />);

    expect(screen.getByText('プレビューなし')).toBeInTheDocument();
    expect(screen.getByText('.xlsx ファイルをアップロードしてください')).toBeInTheDocument();
  });

  it('renders SVG with correct viewBox for A4 portrait', () => {
    const paper = getDefaultPaper();
    render(<PreviewCanvas paper={paper} />);

    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('viewBox', '0 0 210 297');
  });

  it('renders printable area as a dashed rectangle', () => {
    const paper = getDefaultPaper();
    const { container } = render(<PreviewCanvas paper={paper} />);

    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(2);

    const printableRect = rects[1];
    expect(printableRect).toHaveAttribute('stroke-dasharray', '2 2');
  });

  it('displays paper size label', () => {
    const paper = getDefaultPaper();
    render(<PreviewCanvas paper={paper} />);

    expect(screen.getByText('A4 縦')).toBeInTheDocument();
  });
});
