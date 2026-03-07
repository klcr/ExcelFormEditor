import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageTabs } from './PageTabs';

const pages = [
  { sheetName: 'Sheet1', pageIndex: 0 },
  { sheetName: 'Sheet2', pageIndex: 1 },
  { sheetName: 'Sheet3', pageIndex: 2 },
];

describe('PageTabs', () => {
  it('ページが1つの場合は何も表示しない', () => {
    const { container } = render(
      <PageTabs
        pages={[{ sheetName: 'Sheet1', pageIndex: 0 }]}
        activePageIndex={0}
        onPageSelect={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('複数ページの場合、全タブを表示する', () => {
    render(<PageTabs pages={pages} activePageIndex={0} onPageSelect={vi.fn()} />);

    expect(screen.getByText('Sheet1')).toBeInTheDocument();
    expect(screen.getByText('Sheet2')).toBeInTheDocument();
    expect(screen.getByText('Sheet3')).toBeInTheDocument();
  });

  it('アクティブページのタブにアクティブスタイルが適用される', () => {
    render(<PageTabs pages={pages} activePageIndex={1} onPageSelect={vi.fn()} />);

    const tab0 = screen.getByTestId('page-tab-0');
    const tab1 = screen.getByTestId('page-tab-1');

    expect(tab1.className).toContain('tabActive');
    expect(tab0.className).not.toContain('tabActive');
  });

  it('タブクリックで onPageSelect が呼ばれる', () => {
    const onPageSelect = vi.fn();
    render(<PageTabs pages={pages} activePageIndex={0} onPageSelect={onPageSelect} />);

    fireEvent.click(screen.getByTestId('page-tab-2'));
    expect(onPageSelect).toHaveBeenCalledWith(2);
  });
});
