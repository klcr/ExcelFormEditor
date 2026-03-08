import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SheetSelector } from './SheetSelector';

const sheets = [
  { name: 'Sheet1', paperSize: 'A4', orientation: 'portrait' },
  { name: 'Sheet2', paperSize: 'A3', orientation: 'landscape' },
  { name: 'Sheet3', paperSize: 'A4', orientation: 'portrait' },
];

describe('SheetSelector', () => {
  it('全シートをチェックボックス付きで表示する', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0, 1, 2]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(screen.getByText('Sheet1')).toBeInTheDocument();
    expect(screen.getByText('Sheet2')).toBeInTheDocument();
    expect(screen.getByText('Sheet3')).toBeInTheDocument();
  });

  it('選択済みのシートはチェック状態になる', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0, 2]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    const checkbox0 = screen.getByTestId('sheet-checkbox-0') as HTMLInputElement;
    const checkbox1 = screen.getByTestId('sheet-checkbox-1') as HTMLInputElement;
    const checkbox2 = screen.getByTestId('sheet-checkbox-2') as HTMLInputElement;

    expect(checkbox0.checked).toBe(true);
    expect(checkbox1.checked).toBe(false);
    expect(checkbox2.checked).toBe(true);
  });

  it('チェックボックスのトグルで onSelectionChange が呼ばれる', () => {
    const onSelectionChange = vi.fn();

    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0, 2]}
        onSelectionChange={onSelectionChange}
        onImport={vi.fn()}
      />,
    );

    // Uncheck index 0
    fireEvent.click(screen.getByTestId('sheet-checkbox-0'));
    expect(onSelectionChange).toHaveBeenCalledWith([2]);

    // Check index 1
    onSelectionChange.mockClear();
    fireEvent.click(screen.getByTestId('sheet-checkbox-1'));
    expect(onSelectionChange).toHaveBeenCalledWith([0, 1, 2]);
  });

  it('選択なしの場合、読み込みボタンが無効になる', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    const button = screen.getByTestId('import-sheets-button');
    expect(button).toBeDisabled();
  });

  it('読み込みボタンクリックで onImport が呼ばれる', () => {
    const onImport = vi.fn();

    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0]}
        onSelectionChange={vi.fn()}
        onImport={onImport}
      />,
    );

    fireEvent.click(screen.getByTestId('import-sheets-button'));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('disabled の場合、チェックボックスとボタンが無効になる', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
        disabled
      />,
    );

    const checkbox0 = screen.getByTestId('sheet-checkbox-0') as HTMLInputElement;
    expect(checkbox0.disabled).toBe(true);

    const button = screen.getByTestId('import-sheets-button');
    expect(button).toBeDisabled();
  });

  it('選択数と全体数がボタンに表示される', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0, 2]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(screen.getByTestId('import-sheets-button')).toHaveTextContent('読み込み (2/3)');
  });

  it('onExport が渡された場合、エクスポートボタンを表示する', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
        exportDisabled={false}
      />,
    );

    expect(screen.getByTestId('export-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-button')).not.toBeDisabled();
  });

  it('exportDisabled が true の場合、エクスポートボタンが無効になる', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
        exportDisabled
      />,
    );

    expect(screen.getByTestId('export-button')).toBeDisabled();
  });

  it('エクスポートボタンクリックで onExport が呼ばれる', () => {
    const onExport = vi.fn();

    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
        onExport={onExport}
        exportDisabled={false}
      />,
    );

    fireEvent.click(screen.getByTestId('export-button'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('onExport が渡されない場合、エクスポートボタンを表示しない', () => {
    render(
      <SheetSelector
        sheets={sheets}
        selectedIndices={[0]}
        onSelectionChange={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
  });
});
