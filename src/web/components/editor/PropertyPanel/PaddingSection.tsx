import type { BoxPadding } from '@domain/box';
import styles from './PropertyPanel.module.css';

type PaddingSectionProps = {
  readonly padding: BoxPadding | undefined;
  readonly onChange: (newPadding: BoxPadding) => void;
};

const DEFAULT_PADDING: BoxPadding = { top: 0, right: 0, bottom: 0, left: 0 };

const EDGES: readonly { key: keyof BoxPadding; label: string }[] = [
  { key: 'top', label: '上' },
  { key: 'right', label: '右' },
  { key: 'bottom', label: '下' },
  { key: 'left', label: '左' },
];

export function PaddingSection({ padding, onChange }: PaddingSectionProps) {
  const current = padding ?? DEFAULT_PADDING;

  const handleChange = (key: keyof BoxPadding, rawValue: string) => {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed) || parsed < 0) return;
    onChange({ ...current, [key]: parsed });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>余白 (mm)</div>
      <div className={styles.fieldGroup}>
        {EDGES.map(({ key, label }) => (
          <div key={key} className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={`padding-${key}`}>
              {label}
            </label>
            <input
              id={`padding-${key}`}
              className={styles.fieldInput}
              type="number"
              step="0.5"
              min="0"
              value={current[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              aria-label={`余白${label}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
