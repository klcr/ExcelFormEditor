import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FillSection } from './FillSection';

describe('FillSection', () => {
  it('fill が有効なとき ON 表示・色入力が有効', () => {
    render(<FillSection fill={{ color: 'FF0000' }} onChange={vi.fn()} />);
    expect(screen.getByLabelText('塗りつぶし有効')).toHaveTextContent('ON');
    expect(screen.getByLabelText('塗りつぶし色')).not.toBeDisabled();
    expect(screen.getByLabelText('塗りつぶし色')).toHaveValue('#ff0000');
  });

  it('fill が undefined のとき OFF 表示・色入力が無効', () => {
    render(<FillSection fill={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText('塗りつぶし有効')).toHaveTextContent('OFF');
    expect(screen.getByLabelText('塗りつぶし色')).toBeDisabled();
  });

  it('ON → OFF 切り替えで undefined を返す', () => {
    const onChange = vi.fn();
    render(<FillSection fill={{ color: 'FF0000' }} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('塗りつぶし有効'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('OFF → ON 切り替えでデフォルト白を返す', () => {
    const onChange = vi.fn();
    render(<FillSection fill={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('塗りつぶし有効'));
    expect(onChange).toHaveBeenCalledWith({ color: 'FFFFFF' });
  });

  it('色変更で # を除去した値を返す', () => {
    const onChange = vi.fn();
    render(<FillSection fill={{ color: 'FF0000' }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('塗りつぶし色'), { target: { value: '#00ff00' } });
    expect(onChange).toHaveBeenCalledWith({ color: '00ff00' });
  });
});
