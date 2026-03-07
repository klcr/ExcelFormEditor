import type { BoxDefinition } from '@domain/box';
import type { LineDefinition } from '@domain/line';
import { INCHES_TO_MM, type PaperDefinition, getPaperDimensions } from '@domain/paper';
import { borderStyleToStrokeDasharray, borderStyleToStrokeWidth } from '@web/utils/svgHelpers';
import { BoxSvg } from '../common/BoxSvg';
import styles from './PreviewCanvas.module.css';

type PreviewCanvasProps = {
  readonly paper: PaperDefinition | null;
  readonly boxes?: readonly BoxDefinition[];
  readonly lines?: readonly LineDefinition[];
};

export function PreviewCanvas({ paper, boxes = [], lines = [] }: PreviewCanvasProps) {
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
        <g transform={`translate(${marginLeft}, ${marginTop})`}>
          {boxes.map((box) => (
            <BoxSvg key={box.id} box={box} />
          ))}
          {lines.map((line) => (
            <LineSvg key={line.id} line={line} />
          ))}
        </g>
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

function LineSvg({ line }: { readonly line: LineDefinition }) {
  return (
    <line
      x1={line.start.x}
      y1={line.start.y}
      x2={line.end.x}
      y2={line.end.y}
      stroke={`#${line.color}`}
      strokeWidth={borderStyleToStrokeWidth(line.style)}
      strokeDasharray={borderStyleToStrokeDasharray(line.style)}
    />
  );
}
