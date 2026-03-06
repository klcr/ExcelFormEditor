import type { VariableDefinition, VariableType } from '@domain/variable';
import { validateVariableName } from '@domain/variable';
import { useState } from 'react';
import styles from './PropertyPanel.module.css';

type VariableBindingSectionProps = {
  readonly boxId: string;
  readonly variables: readonly VariableDefinition[];
  readonly onAdd: (variable: Omit<VariableDefinition, 'id'>) => void;
  readonly onRemove: (variableId: string) => void;
};

const VARIABLE_TYPES: readonly { value: VariableType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'date', label: 'date' },
  { value: 'boolean', label: 'boolean' },
];

export function VariableBindingSection({
  boxId,
  variables,
  onAdd,
  onRemove,
}: VariableBindingSectionProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<VariableType>('string');
  const [error, setError] = useState('');

  const boxVariables = variables.filter((v) => v.boxId === boxId);

  const handleAdd = () => {
    const validation = validateVariableName(name);
    if (!validation.valid) {
      setError(validation.reason);
      return;
    }
    setError('');
    onAdd({ name, type, boxId });
    setName('');
    setType('string');
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>変数バインディング</div>
      {boxVariables.length > 0 && (
        <ul className={styles.variableList}>
          {boxVariables.map((v) => (
            <li key={v.id} className={styles.variableItem}>
              <span>
                {v.name} ({v.type})
              </span>
              <button type="button" className={styles.deleteButton} onClick={() => onRemove(v.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.addVariableForm}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={`var-name-${boxId}`}>
            変数名
          </label>
          <input
            id={`var-name-${boxId}`}
            className={styles.fieldInput}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="variableName"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={`var-type-${boxId}`}>
            型
          </label>
          <select
            id={`var-type-${boxId}`}
            className={styles.fieldInput}
            value={type}
            onChange={(e) => setType(e.target.value as VariableType)}
          >
            {VARIABLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={styles.addButton} onClick={handleAdd}>
          追加
        </button>
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}
