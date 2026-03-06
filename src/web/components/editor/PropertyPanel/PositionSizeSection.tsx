import type { BoxDefinition } from '@domain/box';
import styles from './PropertyPanel.module.css';

type PositionSizeSectionProps = {
  readonly box: BoxDefinition;
  readonly onPositionChange: (newPosition: { x: number; y: number }) => void;
  readonly onSizeChange: (newSize: { width: number; height: number }) => void;
};

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function PositionSizeSection({
  box,
  onPositionChange,
  onSizeChange,
}: PositionSizeSectionProps) {
  const { position, size } = box.rect;

  const handlePositionChange = (axis: 'x' | 'y', rawValue: string) => {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed)) return;
    onPositionChange({
      x: axis === 'x' ? parsed : position.x,
      y: axis === 'y' ? parsed : position.y,
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', rawValue: string) => {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed)) return;
    onSizeChange({
      width: dimension === 'width' ? parsed : size.width,
      height: dimension === 'height' ? parsed : size.height,
    });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>位置・サイズ</div>
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-x">
            X位置
          </label>
          <input
            id="prop-x"
            className={styles.fieldInput}
            type="number"
            step="0.1"
            value={roundToOneDecimal(position.x)}
            onChange={(e) => handlePositionChange('x', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-y">
            Y位置
          </label>
          <input
            id="prop-y"
            className={styles.fieldInput}
            type="number"
            step="0.1"
            value={roundToOneDecimal(position.y)}
            onChange={(e) => handlePositionChange('y', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-width">
            幅
          </label>
          <input
            id="prop-width"
            className={styles.fieldInput}
            type="number"
            step="0.1"
            value={roundToOneDecimal(size.width)}
            onChange={(e) => handleSizeChange('width', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-height">
            高さ
          </label>
          <input
            id="prop-height"
            className={styles.fieldInput}
            type="number"
            step="0.1"
            value={roundToOneDecimal(size.height)}
            onChange={(e) => handleSizeChange('height', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
