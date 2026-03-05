import { INCHES_TO_MM, type PaperDefinition, getPaperDimensions } from '@domain/paper';
import styles from './PreviewCanvas.module.css';

type PreviewCanvasProps = {
  readonly paper: PaperDefinition | null;
};

export function PreviewCanvas({ paper }: PreviewCanvasProps) {
  if (!paper) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyStateText}>プレビューなし</span>
          <span className={styles.emptyStateHint}>.xlsx ファイルをアップロードしてください</span>
        </div>
      </div>
    );
  }

  const dimensions = getPaperDimensions(paper.size, paper.orientation);
  const marginLeft = paper.margins.left * INCHES_TO_MM;
  const marginTop = paper.margins.top * INCHES_TO_MM;
  const marginRight = paper.margins.right * INCHES_TO_MM;
  const marginBottom = paper.margins.bottom * INCHES_TO_MM;

  const viewBox = `0 0 ${dimensions.width} ${dimensions.height}`;
  const sizeLabel = `${paper.size} ${paper.orientation === 'portrait' ? '縦' : '横'}`;

  return (
    <div className={styles.container}>
      <svg
        className={styles.svg}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`用紙プレビュー: ${sizeLabel}`}
      >
        <rect
          x={0}
          y={0}
          width={dimensions.width}
          height={dimensions.height}
          fill="white"
          stroke="#999"
          strokeWidth={0.5}
        />
        <rect
          x={marginLeft}
          y={marginTop}
          width={dimensions.width - marginLeft - marginRight}
          height={dimensions.height - marginTop - marginBottom}
          fill="none"
          stroke="#ccc"
          strokeWidth={0.3}
          strokeDasharray="2 2"
        />
        <text
          x={dimensions.width / 2}
          y={dimensions.height - 4}
          textAnchor="middle"
          fontSize={5}
          fill="#999"
        >
          {sizeLabel}
        </text>
      </svg>
    </div>
  );
}
