import type { BoxDefinition } from '@domain/box';
import { generateBoxCss } from '@domain/box';
import styles from './CssPreview.module.css';

type CssPreviewProps = {
  readonly boxes: readonly BoxDefinition[];
  readonly selectedBoxIds: readonly string[];
};

/**
 * 選択されたボックスの CSS をプレビュー表示するコンポーネント。
 * ボックスを1つ選択すると生成された CSS を表示し、コピーボタンでクリップボードにコピー可能。
 */
export function CssPreview({ boxes, selectedBoxIds }: CssPreviewProps) {
  if (selectedBoxIds.length !== 1) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>ボックスを1つ選択してCSSを表示</p>
      </div>
    );
  }

  const selectedBox = boxes.find((box) => box.id === selectedBoxIds[0]);
  if (!selectedBox) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>ボックスを1つ選択してCSSを表示</p>
      </div>
    );
  }

  const cssText = generateBoxCss(selectedBox);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssText);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>CSS プレビュー</span>
        <button type="button" className={styles.copyButton} onClick={handleCopy}>
          コピー
        </button>
      </div>
      <pre className={styles.codeBlock}>
        <code className={styles.code}>{cssText}</code>
      </pre>
    </div>
  );
}
