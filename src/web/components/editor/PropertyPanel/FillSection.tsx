import type { BoxFill } from '@domain/box';
import styles from './PropertyPanel.module.css';

type FillSectionProps = {
  readonly fill: BoxFill | undefined;
  readonly onChange: (newFill: BoxFill | undefined) => void;
};

/** 塗りつぶし色が # 付きであることを保証する */
function ensureHash(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/** # を除去して返す（BoxFill.color のフォーマット） */
function stripHash(color: string): string {
  return color.startsWith('#') ? color.slice(1) : color;
}

export function FillSection({ fill, onChange }: FillSectionProps) {
  const isEnabled = fill !== undefined;
  const displayColor = isEnabled ? ensureHash(fill.color) : '#ffffff';

  const handleToggle = () => {
    if (isEnabled) {
      onChange(undefined);
    } else {
      onChange({ color: 'FFFFFF' });
    }
  };

  const handleColorChange = (newColor: string) => {
    onChange({ color: stripHash(newColor) });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>塗りつぶし</div>
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>有効</span>
          <button
            type="button"
            className={isEnabled ? styles.toggleButtonActive : styles.toggleButton}
            onClick={handleToggle}
            aria-label="塗りつぶし有効"
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="fill-color">
            色
          </label>
          <input
            id="fill-color"
            className={styles.colorInput}
            type="color"
            value={displayColor}
            disabled={!isEnabled}
            onChange={(e) => handleColorChange(e.target.value)}
            aria-label="塗りつぶし色"
          />
        </div>
      </div>
    </div>
  );
}
