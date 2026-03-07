import styles from './PageTabs.module.css';

type PageTabItem = {
  readonly sheetName: string;
  readonly pageIndex: number;
};

type PageTabsProps = {
  readonly pages: readonly PageTabItem[];
  readonly activePageIndex: number;
  readonly onPageSelect: (pageIndex: number) => void;
};

/**
 * ページ切り替え用の水平タブバー。
 * ページが1つの場合は非表示。
 */
export function PageTabs({ pages, activePageIndex, onPageSelect }: PageTabsProps) {
  if (pages.length <= 1) return null;

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
        </button>
      ))}
    </div>
  );
}
