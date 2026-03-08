import type { BoxDefinition } from '@domain/box';
import { sortBoxesByPosition } from '@domain/box';
import type { VariableDefinition, VariableType } from '@domain/variable';
import { validateVariableName } from '@domain/variable';
import { useMemo, useState } from 'react';
import styles from './PropertyPanel.module.css';

type SequentialVariableSectionProps = {
  readonly selectedBoxIds: readonly string[];
  readonly boxes: readonly BoxDefinition[];
  readonly existingVariables: readonly VariableDefinition[];
  readonly onAssign: (params: {
    baseName: string;
    startIndex: number;
    type: VariableType;
    sortedBoxIds: readonly string[];
  }) => void;
};

const VARIABLE_TYPES: readonly { value: VariableType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'date', label: 'date' },
  { value: 'boolean', label: 'boolean' },
];

export function SequentialVariableSection({
  selectedBoxIds,
  boxes,
  existingVariables,
  onAssign,
}: SequentialVariableSectionProps) {
  const [baseName, setBaseName] = useState('');
  const [startIndex, setStartIndex] = useState(1);
  const [type, setType] = useState<VariableType>('string');
  const [error, setError] = useState('');

  const sortedBoxIds = useMemo(() => {
    const selectedBoxes = boxes.filter((b) => selectedBoxIds.includes(b.id));
    return sortBoxesByPosition(selectedBoxes).map((b) => b.id);
  }, [selectedBoxIds, boxes]);

  const preview = useMemo(() => {
    if (!baseName) return '';
    const names = sortedBoxIds.map((_, i) => `${baseName}${startIndex + i}`);
    if (names.length <= 5) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} ... ${names[names.length - 1]}`;
  }, [baseName, startIndex, sortedBoxIds]);

  const handleAssign = () => {
    if (!baseName) {
      setError('ベース名を入力してください');
      return;
    }

    // 生成される各変数名をバリデーション
    for (let i = 0; i < sortedBoxIds.length; i++) {
      const name = `${baseName}${startIndex + i}`;
      const validation = validateVariableName(name);
      if (!validation.valid) {
        setError(`${name}: ${validation.reason}`);
        return;
      }
      // 既存変数との重複チェック
      if (existingVariables.some((v) => v.name === name)) {
        setError(`変数名が重複しています: ${name}`);
        return;
      }
    }

    setError('');
    onAssign({ baseName, startIndex, type, sortedBoxIds });
    setBaseName('');
    setStartIndex(1);
    setType('string');
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>連番変数の割り当て</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="seq-var-base">
              ベース名
            </label>
            <input
              id="seq-var-base"
              className={styles.fieldInput}
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder="field"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="seq-var-start">
              開始番号
            </label>
            <input
              id="seq-var-start"
              className={styles.fieldInput}
              type="number"
              min={0}
              value={startIndex}
              onChange={(e) => setStartIndex(Number.parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="seq-var-type">
            型
          </label>
          <select
            id="seq-var-type"
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
        {preview && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted, #888)',
              padding: '4px 0',
            }}
            data-testid="seq-var-preview"
          >
            {preview}
          </div>
        )}
        <button type="button" className={styles.addButton} onClick={handleAssign}>
          割り当て
        </button>
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}
