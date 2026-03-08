import styles from './PageTabs.module.css';

type PageTabItem = {
  readonly sheetName: string;
  readonly pageIndex: number;
};

type PageTabsProps = {
  readonly pages: readonly PageTabItem[];
  readonly activePageIndex: number;
  readonly onPageSelect: (pageIndex: number) => void;
  readonly onPageClose?: (pageIndex: number) => void;
};

/**
 * ページ切り替え用の水平タブバー。
 * onPageClose が未指定の場合、ページが1つなら非表示。
 * onPageClose が指定されている場合は常に表示（閉じボタン付き）。
 */
export function PageTabs({ pages, activePageIndex, onPageSelect, onPageClose }: PageTabsProps) {
  if (!onPageClose && pages.length <= 1) return null;
  if (pages.length === 0) return null;

  return (
    <div className={styles.tabs} data-testid="page-tabs">
      {pages.map((page) => (
        <button
          key={page.pageIndex}
          type="button"
          className={`${styles.tab} ${page.pageIndex === activePageIndex ? styles.tabActive : ''}`}
          data-testid={`page-tab-${page.pageIndex}`}
          onClick={() => onPageSelect(page.pageIndex)}
        >
          {page.sheetName}
          {onPageClose && (
            <span
              className={styles.closeButton}
              data-testid={`page-close-${page.pageIndex}`}
              onClick={(e) => {
                e.stopPropagation();
                onPageClose(page.pageIndex);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onPageClose(page.pageIndex);
                }
              }}
            >
              ×
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
