import type { BoxAlignment, BoxFont } from '@domain/box';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextStyleSection } from './TextStyleSection';

const defaultFont: BoxFont = {
  name: 'MS Gothic',
  sizePt: 11,
  bold: false,
  italic: false,
  color: '#000000',
};

const defaultAlignment: BoxAlignment = {
  horizontal: 'left',
  vertical: 'top',
  wrapText: false,
};

function renderSection(overrides?: {
  font?: BoxFont;
  alignment?: BoxAlignment;
  onFontChange?: ReturnType<typeof vi.fn>;
  onAlignmentChange?: ReturnType<typeof vi.fn>;
}) {
  const props = {
    font: overrides?.font ?? defaultFont,
    alignment: overrides?.alignment ?? defaultAlignment,
    onFontChange: overrides?.onFontChange ?? vi.fn(),
    onAlignmentChange: overrides?.onAlignmentChange ?? vi.fn(),
  };
  return { ...render(<TextStyleSection {...props} />), props };
}

describe('TextStyleSection', () => {
  it('renders font name and size', () => {
    renderSection();

    expect(screen.getByLabelText('フォント名')).toHaveValue('MS Gothic');
    expect(screen.getByLabelText('サイズ (pt)')).toHaveValue(11);
  });

  it('changing font size calls onFontChange', () => {
    const onFontChange = vi.fn();
    renderSection({ onFontChange });

    fireEvent.change(screen.getByLabelText('サイズ (pt)'), { target: { value: '14' } });
    expect(onFontChange).toHaveBeenCalledWith({ ...defaultFont, sizePt: 14 });
  });

  it('toggling bold calls onFontChange with updated bold', () => {
    const onFontChange = vi.fn();
    renderSection({ onFontChange });

    fireEvent.click(screen.getByLabelText('太字'));
    expect(onFontChange).toHaveBeenCalledWith({ ...defaultFont, bold: true });
  });

  it('toggling italic calls onFontChange with updated italic', () => {
    const onFontChange = vi.fn();
    renderSection({ onFontChange });

    fireEvent.click(screen.getByLabelText('斜体'));
    expect(onFontChange).toHaveBeenCalledWith({ ...defaultFont, italic: true });
  });

  it('changing horizontal alignment calls onAlignmentChange', () => {
    const onAlignmentChange = vi.fn();
    renderSection({ onAlignmentChange });

    fireEvent.change(screen.getByLabelText('水平配置'), { target: { value: 'center' } });
    expect(onAlignmentChange).toHaveBeenCalledWith({ ...defaultAlignment, horizontal: 'center' });
  });

  it('changing vertical alignment calls onAlignmentChange', () => {
    const onAlignmentChange = vi.fn();
    renderSection({ onAlignmentChange });

    fireEvent.change(screen.getByLabelText('垂直配置'), { target: { value: 'bottom' } });
    expect(onAlignmentChange).toHaveBeenCalledWith({ ...defaultAlignment, vertical: 'bottom' });
  });

  it('changing font name calls onFontChange', () => {
    const onFontChange = vi.fn();
    renderSection({ onFontChange });

    fireEvent.change(screen.getByLabelText('フォント名'), { target: { value: 'Arial' } });
    expect(onFontChange).toHaveBeenCalledWith({ ...defaultFont, name: 'Arial' });
  });
});
