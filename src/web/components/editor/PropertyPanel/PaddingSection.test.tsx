import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaddingSection } from './PaddingSection';

describe('PaddingSection', () => {
  it('renders all 4 edge inputs with section title', () => {
    render(<PaddingSection padding={undefined} onChange={vi.fn()} />);
    expect(screen.getByText('余白 (mm)')).toBeInTheDocument();
    expect(screen.getByLabelText('余白上')).toBeInTheDocument();
    expect(screen.getByLabelText('余白右')).toBeInTheDocument();
    expect(screen.getByLabelText('余白下')).toBeInTheDocument();
    expect(screen.getByLabelText('余白左')).toBeInTheDocument();
  });

  it('shows 0 for all edges when padding is undefined', () => {
    render(<PaddingSection padding={undefined} onChange={vi.fn()} />);
    const inputs = screen.getAllByRole('spinbutton');
    for (const input of inputs) {
      expect(input).toHaveValue(0);
    }
  });

  it('shows provided padding values', () => {
    render(
      <PaddingSection padding={{ top: 1, right: 2, bottom: 3, left: 4 }} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('余白上')).toHaveValue(1);
    expect(screen.getByLabelText('余白右')).toHaveValue(2);
    expect(screen.getByLabelText('余白下')).toHaveValue(3);
    expect(screen.getByLabelText('余白左')).toHaveValue(4);
  });

  it('calls onChange with updated padding when a value changes', () => {
    const onChange = vi.fn();
    render(
      <PaddingSection padding={{ top: 1, right: 2, bottom: 3, left: 4 }} onChange={onChange} />,
    );

    const topInput = screen.getByLabelText('余白上');
    fireEvent.change(topInput, { target: { value: '5' } });

    expect(onChange).toHaveBeenCalledWith({ top: 5, right: 2, bottom: 3, left: 4 });
  });
});
