import { useEffect, useRef } from 'react';
import styles from './PageSelector.module.css';

type PageItem = {
  readonly pageIndex: number;
  readonly pageName: string;
};

type PageGroup = {
  readonly sheetName: string;
  readonly pages: readonly PageItem[];
};

type PageSelectorProps = {
  readonly groups: readonly PageGroup[];
  readonly selectedPageIndices: readonly number[];
  readonly onSelectionChange: (indices: number[]) => void;
  readonly onExport?: () => void;
  readonly exportDisabled?: boolean;
};

export type { PageGroup, PageItem };

/**
 * サイドバーに表示するページ選択ツリー。
 * シート > 印刷ページ のツリー構造でチェックボックスを表示し、
 * エクスポート対象のページを選択する。
 */
export function PageSelector({
  groups,
  selectedPageIndices,
  onSelectionChange,
  onExport,
  exportDisabled = true,
}: PageSelectorProps) {
  const handlePageToggle = (pageIndex: number) => {
    if (selectedPageIndices.includes(pageIndex)) {
      onSelectionChange(selectedPageIndices.filter((i) => i !== pageIndex));
    } else {
      onSelectionChange([...selectedPageIndices, pageIndex].sort((a, b) => a - b));
    }
  };

  const handleGroupToggle = (group: PageGroup) => {
    const groupIndices = group.pages.map((p) => p.pageIndex);
    const allSelected = groupIndices.every((i) => selectedPageIndices.includes(i));

    if (allSelected) {
      onSelectionChange(selectedPageIndices.filter((i) => !groupIndices.includes(i)));
    } else {
      const merged = new Set([...selectedPageIndices, ...groupIndices]);
      onSelectionChange([...merged].sort((a, b) => a - b));
    }
  };

  const totalPages = groups.reduce((sum, g) => sum + g.pages.length, 0);
  const selectedCount = selectedPageIndices.length;

  return (
    <div className={styles.container} data-testid="page-selector">
      <div className={styles.title}>ページ選択</div>
      <div className={styles.tree}>
        {groups.map((group) => (
          <SheetGroup
            key={group.sheetName}
            group={group}
            selectedPageIndices={selectedPageIndices}
            onGroupToggle={handleGroupToggle}
            onPageToggle={handlePageToggle}
          />
        ))}
      </div>
      {onExport && (
        <button
          type="button"
          className={styles.exportButton}
          onClick={onExport}
          disabled={exportDisabled}
          data-testid="export-button"
        >
          エクスポート ({selectedCount}/{totalPages})
        </button>
      )}
    </div>
  );
}

function SheetGroup({
  group,
  selectedPageIndices,
  onGroupToggle,
  onPageToggle,
}: {
  readonly group: PageGroup;
  readonly selectedPageIndices: readonly number[];
  readonly onGroupToggle: (group: PageGroup) => void;
  readonly onPageToggle: (pageIndex: number) => void;
}) {
  const groupIndices = group.pages.map((p) => p.pageIndex);
  const selectedCount = groupIndices.filter((i) => selectedPageIndices.includes(i)).length;
  const allSelected = selectedCount === groupIndices.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const isSinglePage = group.pages.length === 1;

  if (isSinglePage) {
    const page = group.pages[0];
    if (!page) return null;
    return (
      <div className={styles.singleItem}>
        <label>
          <input
            type="checkbox"
            checked={selectedPageIndices.includes(page.pageIndex)}
            onChange={() => onPageToggle(page.pageIndex)}
            data-testid={`page-checkbox-${page.pageIndex}`}
          />
          {group.sheetName}
        </label>
      </div>
    );
  }

  return (
    <div className={styles.group} data-testid={`sheet-group-${group.sheetName}`}>
      <div className={styles.groupHeader}>
        <label>
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={allSelected}
            onChange={() => onGroupToggle(group)}
            data-testid={`group-checkbox-${group.sheetName}`}
          />
          <strong>{group.sheetName}</strong>
        </label>
      </div>
      <div className={styles.groupChildren}>
        {group.pages.map((page) => (
          <div key={page.pageIndex} className={styles.pageItem}>
            <label>
              <input
                type="checkbox"
                checked={selectedPageIndices.includes(page.pageIndex)}
                onChange={() => onPageToggle(page.pageIndex)}
                data-testid={`page-checkbox-${page.pageIndex}`}
              />
              {page.pageName}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
