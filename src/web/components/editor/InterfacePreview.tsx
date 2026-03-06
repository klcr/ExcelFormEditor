import type { VariableDefinition } from '@domain/variable';
import { generateTypeScriptInterface } from '@domain/variable';
import styles from './PropertyPanel/PropertyPanel.module.css';

type InterfacePreviewProps = {
  readonly interfaceName: string;
  readonly variables: readonly VariableDefinition[];
};

export function InterfacePreview({ interfaceName, variables }: InterfacePreviewProps) {
  if (variables.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyState}>変数を追加してプレビューを表示</p>
      </div>
    );
  }

  const code = generateTypeScriptInterface(interfaceName, variables);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>インターフェースプレビュー</div>
        <pre>
          <code>{code}</code>
        </pre>
        <button type="button" className={styles.addButton} onClick={handleCopy}>
          コピー
        </button>
      </div>
    </div>
  );
}
