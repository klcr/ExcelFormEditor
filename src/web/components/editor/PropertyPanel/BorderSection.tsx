import type { BorderEdge, BorderStyle, BoxBorder } from '@domain/box';
import styles from './PropertyPanel.module.css';

type BorderSectionProps = {
  readonly border: BoxBorder;
  readonly onChange: (newBorder: BoxBorder) => void;
};

const EDGE_LABELS: readonly { key: keyof BoxBorder; label: string }[] = [
  { key: 'top', label: '上' },
  { key: 'bottom', label: '下' },
  { key: 'left', label: '左' },
  { key: 'right', label: '右' },
];

const BORDER_STYLE_OPTIONS: readonly { value: BorderStyle; label: string }[] = [
  { value: 'thin', label: 'thin' },
  { value: 'medium', label: 'medium' },
  { value: 'thick', label: 'thick' },
  { value: 'dotted', label: 'dotted' },
  { value: 'dashed', label: 'dashed' },
  { value: 'double', label: 'double' },
  { value: 'hair', label: 'hair' },
];

const DEFAULT_EDGE: BorderEdge = { style: 'thin', color: '#000000' };

function BorderEdgeRow({
  label,
  edge,
  onEdgeChange,
}: {
  readonly label: string;
  readonly edge: BorderEdge | undefined;
  readonly onEdgeChange: (newEdge: BorderEdge | undefined) => void;
}) {
  const enabled = edge !== undefined;
  const currentEdge = edge ?? DEFAULT_EDGE;

  const handleToggle = () => {
    onEdgeChange(enabled ? undefined : DEFAULT_EDGE);
  };

  const handleStyleChange = (newStyle: BorderStyle) => {
    onEdgeChange({ ...currentEdge, style: newStyle });
  };

  const handleColorChange = (newColor: string) => {
    onEdgeChange({ ...currentEdge, color: newColor });
  };

  return (
    <div className={styles.borderRow}>
      <span className={styles.borderRowLabel}>{label}</span>
      <select
        aria-label={`${label}スタイル`}
        className={styles.fieldSelect}
        value={currentEdge.style}
        disabled={!enabled}
        onChange={(e) => handleStyleChange(e.target.value as BorderStyle)}
      >
        {BORDER_STYLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        aria-label={`${label}色`}
        className={styles.colorInput}
        type="color"
        value={currentEdge.color}
        disabled={!enabled}
        onChange={(e) => handleColorChange(e.target.value)}
      />
      <button
        type="button"
        aria-label={`${label}有効`}
        className={enabled ? styles.toggleButtonActive : styles.toggleButton}
        onClick={handleToggle}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export function BorderSection({ border, onChange }: BorderSectionProps) {
  const handleEdgeChange = (key: keyof BoxBorder, newEdge: BorderEdge | undefined) => {
    onChange({ ...border, [key]: newEdge });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>罫線</div>
      {EDGE_LABELS.map(({ key, label }) => (
        <BorderEdgeRow
          key={key}
          label={label}
          edge={border[key]}
          onEdgeChange={(newEdge) => handleEdgeChange(key, newEdge)}
        />
      ))}
    </div>
  );
}
