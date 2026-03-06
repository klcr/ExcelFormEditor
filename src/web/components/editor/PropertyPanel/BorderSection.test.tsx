import type { BoxBorder } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BorderSection } from './BorderSection';

const fullBorder: BoxBorder = {
  top: { style: 'thin', color: '#000000' },
  bottom: { style: 'medium', color: '#ff0000' },
  left: { style: 'dashed', color: '#00ff00' },
  right: { style: 'thick', color: '#0000ff' },
};

const partialBorder: BoxBorder = {
  top: { style: 'thin', color: '#000000' },
};

describe('BorderSection', () => {
  it('renders border controls for each edge', () => {
    render(<BorderSection border={fullBorder} onChange={vi.fn()} />);

    expect(screen.getByLabelText('上スタイル')).toBeInTheDocument();
    expect(screen.getByLabelText('下スタイル')).toBeInTheDocument();
    expect(screen.getByLabelText('左スタイル')).toBeInTheDocument();
    expect(screen.getByLabelText('右スタイル')).toBeInTheDocument();
  });

  it('changing style calls onChange with updated border', () => {
    const onChange = vi.fn();
    render(<BorderSection border={fullBorder} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('上スタイル'), { target: { value: 'double' } });
    expect(onChange).toHaveBeenCalledWith({
      ...fullBorder,
      top: { style: 'double', color: '#000000' },
    });
  });

  it('disabled edges are shown correctly', () => {
    render(<BorderSection border={partialBorder} onChange={vi.fn()} />);

    // Top is enabled
    expect(screen.getByLabelText('上スタイル')).not.toBeDisabled();
    expect(screen.getByLabelText('上有効')).toHaveTextContent('ON');

    // Bottom is disabled (undefined)
    expect(screen.getByLabelText('下スタイル')).toBeDisabled();
    expect(screen.getByLabelText('下有効')).toHaveTextContent('OFF');
  });

  it('toggling enable creates a default edge', () => {
    const onChange = vi.fn();
    render(<BorderSection border={partialBorder} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('下有効'));
    expect(onChange).toHaveBeenCalledWith({
      ...partialBorder,
      bottom: { style: 'thin', color: '#000000' },
    });
  });

  it('toggling disable removes the edge', () => {
    const onChange = vi.fn();
    render(<BorderSection border={fullBorder} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('上有効'));
    expect(onChange).toHaveBeenCalledWith({
      ...fullBorder,
      top: undefined,
    });
  });
});
