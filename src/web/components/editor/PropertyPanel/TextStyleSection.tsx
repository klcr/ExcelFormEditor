import type { BoxAlignment, BoxFont, HorizontalAlignment, VerticalAlignment } from '@domain/box';
import styles from './PropertyPanel.module.css';

type TextStyleSectionProps = {
  readonly font: BoxFont;
  readonly alignment: BoxAlignment;
  readonly onFontChange: (newFont: BoxFont) => void;
  readonly onAlignmentChange: (newAlignment: BoxAlignment) => void;
};

const HORIZONTAL_OPTIONS: readonly { value: HorizontalAlignment; label: string }[] = [
  { value: 'left', label: '左' },
  { value: 'center', label: '中央' },
  { value: 'right', label: '右' },
];

const VERTICAL_OPTIONS: readonly { value: VerticalAlignment; label: string }[] = [
  { value: 'top', label: '上' },
  { value: 'middle', label: '中央' },
  { value: 'bottom', label: '下' },
];

export function TextStyleSection({
  font,
  alignment,
  onFontChange,
  onAlignmentChange,
}: TextStyleSectionProps) {
  const handleFontNameChange = (name: string) => {
    onFontChange({ ...font, name });
  };

  const handleFontSizeChange = (rawValue: string) => {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed)) return;
    onFontChange({ ...font, sizePt: parsed });
  };

  const handleBoldToggle = () => {
    onFontChange({ ...font, bold: !font.bold });
  };

  const handleItalicToggle = () => {
    onFontChange({ ...font, italic: !font.italic });
  };

  const handleColorChange = (color: string) => {
    onFontChange({ ...font, color });
  };

  const handleHorizontalChange = (horizontal: HorizontalAlignment) => {
    onAlignmentChange({ ...alignment, horizontal });
  };

  const handleVerticalChange = (vertical: VerticalAlignment) => {
    onAlignmentChange({ ...alignment, vertical });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>テキストスタイル</div>
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-font-name">
            フォント名
          </label>
          <input
            id="prop-font-name"
            className={styles.fieldInput}
            type="text"
            value={font.name}
            onChange={(e) => handleFontNameChange(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-font-size">
            サイズ (pt)
          </label>
          <input
            id="prop-font-size"
            className={styles.fieldInput}
            type="number"
            step="0.5"
            min="1"
            value={font.sizePt}
            onChange={(e) => handleFontSizeChange(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.fieldGroup} style={{ marginTop: 8 }}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>スタイル</span>
          <div className={styles.toggleGroup}>
            <button
              type="button"
              aria-label="太字"
              className={font.bold ? styles.toggleButtonActive : styles.toggleButton}
              onClick={handleBoldToggle}
            >
              B
            </button>
            <button
              type="button"
              aria-label="斜体"
              className={font.italic ? styles.toggleButtonActive : styles.toggleButton}
              onClick={handleItalicToggle}
            >
              I
            </button>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-font-color">
            文字色
          </label>
          <input
            id="prop-font-color"
            className={styles.colorInput}
            type="color"
            value={font.color}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.fieldGroup} style={{ marginTop: 8 }}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-h-align">
            水平配置
          </label>
          <select
            id="prop-h-align"
            className={styles.fieldSelect}
            value={alignment.horizontal}
            onChange={(e) => handleHorizontalChange(e.target.value as HorizontalAlignment)}
          >
            {HORIZONTAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="prop-v-align">
            垂直配置
          </label>
          <select
            id="prop-v-align"
            className={styles.fieldSelect}
            value={alignment.vertical}
            onChange={(e) => handleVerticalChange(e.target.value as VerticalAlignment)}
          >
            {VERTICAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
