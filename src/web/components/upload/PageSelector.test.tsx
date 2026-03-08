import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageSelector } from './PageSelector';

const groups = [
  {
    sheetName: 'Sheet1',
    pages: [
      { pageIndex: 0, pageName: 'Sheet1 (1/2)' },
      { pageIndex: 1, pageName: 'Sheet1 (2/2)' },
    ],
  },
  {
    sheetName: 'Sheet2',
    pages: [{ pageIndex: 2, pageName: 'Sheet2' }],
  },
];

describe('PageSelector', () => {
  it('ツリー構造でページを表示する', () => {
    render(
      <PageSelector groups={groups} selectedPageIndices={[0, 1, 2]} onSelectionChange={vi.fn()} />,
    );

    expect(screen.getByTestId('page-selector')).toBeInTheDocument();
    expect(screen.getByText('Sheet1')).toBeInTheDocument();
    expect(screen.getByText('Sheet1 (1/2)')).toBeInTheDocument();
    expect(screen.getByText('Sheet1 (2/2)')).toBeInTheDocument();
    expect(screen.getByText('Sheet2')).toBeInTheDocument();
  });

  it('選択済みページのチェックボックスがチェック状態になる', () => {
    render(
      <PageSelector groups={groups} selectedPageIndices={[0, 2]} onSelectionChange={vi.fn()} />,
    );

    const cb0 = screen.getByTestId('page-checkbox-0') as HTMLInputElement;
    const cb1 = screen.getByTestId('page-checkbox-1') as HTMLInputElement;
    const cb2 = screen.getByTestId('page-checkbox-2') as HTMLInputElement;

    expect(cb0.checked).toBe(true);
    expect(cb1.checked).toBe(false);
    expect(cb2.checked).toBe(true);
  });

  it('ページチェックボックスのトグルで onSelectionChange が呼ばれる', () => {
    const onChange = vi.fn();

    render(
      <PageSelector groups={groups} selectedPageIndices={[0, 1]} onSelectionChange={onChange} />,
    );

    // Uncheck page 0
    fireEvent.click(screen.getByTestId('page-checkbox-0'));
    expect(onChange).toHaveBeenCalledWith([1]);

    // Check page 2
    onChange.mockClear();
    fireEvent.click(screen.getByTestId('page-checkbox-2'));
    expect(onChange).toHaveBeenCalledWith([0, 1, 2]);
  });

  it('グループチェックで配下の全ページを一括解除する', () => {
    const onChange = vi.fn();

    render(
      <PageSelector groups={groups} selectedPageIndices={[0, 1, 2]} onSelectionChange={onChange} />,
    );

    fireEvent.click(screen.getByTestId('group-checkbox-Sheet1'));
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('グループチェックで配下の全ページを一括選択する', () => {
    const onChange = vi.fn();

    render(<PageSelector groups={groups} selectedPageIndices={[2]} onSelectionChange={onChange} />);
    fireEvent.click(screen.getByTestId('group-checkbox-Sheet1'));
    expect(onChange).toHaveBeenCalledWith([0, 1, 2]);
  });

  it('単一ページのシートはグループヘッダーなしで表示する', () => {
    render(<PageSelector groups={groups} selectedPageIndices={[2]} onSelectionChange={vi.fn()} />);

    // Sheet2 has only 1 page, so no group header checkbox
    expect(screen.queryByTestId('group-checkbox-Sheet2')).not.toBeInTheDocument();
    // But page checkbox exists
    expect(screen.getByTestId('page-checkbox-2')).toBeInTheDocument();
  });

  it('onExport が渡された場合、エクスポートボタンを表示する', () => {
    render(
      <PageSelector
        groups={groups}
        selectedPageIndices={[0]}
        onSelectionChange={vi.fn()}
        onExport={vi.fn()}
        exportDisabled={false}
      />,
    );

    expect(screen.getByTestId('export-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-button')).not.toBeDisabled();
    expect(screen.getByTestId('export-button')).toHaveTextContent('エクスポート (1/3)');
  });

  it('exportDisabled が true の場合、エクスポートボタンが無効になる', () => {
    render(
      <PageSelector
        groups={groups}
        selectedPageIndices={[]}
        onSelectionChange={vi.fn()}
        onExport={vi.fn()}
        exportDisabled
      />,
    );

    expect(screen.getByTestId('export-button')).toBeDisabled();
  });

  it('エクスポートボタンクリックで onExport が呼ばれる', () => {
    const onExport = vi.fn();

    render(
      <PageSelector
        groups={groups}
        selectedPageIndices={[0]}
        onSelectionChange={vi.fn()}
        onExport={onExport}
        exportDisabled={false}
      />,
    );

    fireEvent.click(screen.getByTestId('export-button'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('onExport が渡されない場合、エクスポートボタンを表示しない', () => {
    render(<PageSelector groups={groups} selectedPageIndices={[0]} onSelectionChange={vi.fn()} />);

    expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
  });
});
