import type { VariableDefinition } from '@domain/variable';
import styles from './PropertyPanel/PropertyPanel.module.css';

type VariableListPanelProps = {
  readonly variables: readonly VariableDefinition[];
  readonly onRemove: (variableId: string) => void;
};

export function VariableListPanel({ variables, onRemove }: VariableListPanelProps) {
  if (variables.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyState}>変数が定義されていません</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>変数一覧</div>
        <ul className={styles.variableList}>
          {variables.map((v) => (
            <li key={v.id} className={styles.variableItem}>
              <span>
                {v.name} ({v.type}) — {v.boxId}
              </span>
              <button type="button" className={styles.deleteButton} onClick={() => onRemove(v.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
