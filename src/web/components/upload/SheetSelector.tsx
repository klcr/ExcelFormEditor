import styles from './SheetSelector.module.css';

type SheetInfo = {
  readonly name: string;
  readonly paperSize: string;
  readonly orientation: string;
  readonly pageCount?: number;
};

type SheetSelectorProps = {
  readonly sheets: readonly SheetInfo[];
  readonly selectedIndices: readonly number[];
  readonly onSelectionChange: (indices: number[]) => void;
  readonly onImport: () => void;
  readonly onExport?: () => void;
  readonly exportDisabled?: boolean;
  readonly disabled?: boolean;
};

/**
 * サイドバーに表示するシート選択チェックリスト。
 * パース成功後に各シートの名前・用紙情報とともに表示し、
 * ユーザーが読み込むシートを選択する。
 */
export function SheetSelector({
  sheets,
  selectedIndices,
  onSelectionChange,
  onImport,
  onExport,
  exportDisabled = true,
  disabled = false,
}: SheetSelectorProps) {
  const handleToggle = (index: number) => {
    if (selectedIndices.includes(index)) {
      onSelectionChange(selectedIndices.filter((i) => i !== index));
    } else {
      onSelectionChange([...selectedIndices, index].sort((a, b) => a - b));
    }
  };

  const hasSelection = selectedIndices.length > 0;

  return (
    <div className={styles.container} data-testid="sheet-selector">
      <div className={styles.title}>シート選択</div>
      <div className={styles.list}>
        {sheets.map((sheet, index) => (
          <div key={sheet.name} className={styles.item}>
            <label>
              <input
                type="checkbox"
                checked={selectedIndices.includes(index)}
                onChange={() => handleToggle(index)}
                disabled={disabled}
                data-testid={`sheet-checkbox-${index}`}
              />
              {sheet.name}
              <span className={styles.sheetInfo}>
                {sheet.paperSize} {sheet.orientation}
                {sheet.pageCount != null && sheet.pageCount > 1 && ` (${sheet.pageCount}ページ)`}
              </span>
            </label>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.importButton}
        onClick={onImport}
        disabled={disabled || !hasSelection}
        data-testid="import-sheets-button"
      >
        読み込み ({selectedIndices.length}/{sheets.length})
      </button>
      {onExport && (
        <button
          type="button"
          className={styles.exportButton}
          onClick={onExport}
          disabled={exportDisabled}
          data-testid="export-button"
        >
          エクスポート
        </button>
      )}
    </div>
  );
}
