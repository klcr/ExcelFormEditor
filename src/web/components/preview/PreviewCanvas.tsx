import type { BoxDefinition } from '@domain/box';
import type { LineDefinition } from '@domain/line';
import { INCHES_TO_MM, type PaperDefinition, getPaperDimensions } from '@domain/paper';
import { borderStyleToStrokeDasharray, borderStyleToStrokeWidth } from '@web/utils/svgHelpers';
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

function BoxSvg({ box }: { readonly box: BoxDefinition }) {
  const { x, y } = box.rect.position;
  const { width, height } = box.rect.size;
  const fontSize = Math.min(box.font.sizePt * 0.3528, height * 0.8);

  const clipId = `clip-${box.id}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      {box.fill && <rect x={x} y={y} width={width} height={height} fill={`#${box.fill.color}`} />}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={box.fill ? 'none' : 'transparent'}
        stroke="none"
      />
      {box.border.top && (
        <line
          x1={x}
          y1={y}
          x2={x + width}
          y2={y}
          stroke={`#${box.border.top.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.top.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.top.style)}
        />
      )}
      {box.border.bottom && (
        <line
          x1={x}
          y1={y + height}
          x2={x + width}
          y2={y + height}
          stroke={`#${box.border.bottom.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.bottom.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.bottom.style)}
        />
      )}
      {box.border.left && (
        <line
          x1={x}
          y1={y}
          x2={x}
          y2={y + height}
          stroke={`#${box.border.left.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.left.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.left.style)}
        />
      )}
      {box.border.right && (
        <line
          x1={x + width}
          y1={y}
          x2={x + width}
          y2={y + height}
          stroke={`#${box.border.right.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.right.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.right.style)}
        />
      )}
      {box.content && (
        <text
          x={
            x +
            (box.alignment.horizontal === 'center'
              ? width / 2
              : box.alignment.horizontal === 'right'
                ? width - 0.5
                : 0.5)
          }
          y={
            y +
            (box.alignment.vertical === 'middle'
              ? height / 2
              : box.alignment.vertical === 'bottom'
                ? height - 0.5
                : fontSize)
          }
          textAnchor={
            box.alignment.horizontal === 'center'
              ? 'middle'
              : box.alignment.horizontal === 'right'
                ? 'end'
                : 'start'
          }
          dominantBaseline={
            box.alignment.vertical === 'middle'
              ? 'central'
              : box.alignment.vertical === 'bottom'
                ? 'auto'
                : 'hanging'
          }
          fontSize={fontSize}
          fontFamily={box.font.name}
          fontWeight={box.font.bold ? 'bold' : 'normal'}
          fontStyle={box.font.italic ? 'italic' : 'normal'}
          fill={`#${box.font.color}`}
          clipPath={`url(#${clipId})`}
        >
          {box.content}
        </text>
      )}
    </g>
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
