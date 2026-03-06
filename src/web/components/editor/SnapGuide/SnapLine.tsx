import type { SnapGuideResult } from '@domain/box';

type SnapLineProps = {
  readonly guides: SnapGuideResult;
  readonly viewBoxWidth: number;
  readonly viewBoxHeight: number;
};

const GUIDE_COLOR = '#FF00FF';
const GUIDE_OPACITY = 0.6;
const GUIDE_STROKE_WIDTH = 0.3;
const GUIDE_DASH = '1 1';

/**
 * スナップガイド線を SVG 上に描画するコンポーネント
 * X ガイド → 垂直線（viewBox 全高）
 * Y ガイド → 水平線（viewBox 全幅）
 */
export function SnapLine({ guides, viewBoxWidth, viewBoxHeight }: SnapLineProps) {
  if (guides.x.length === 0 && guides.y.length === 0) {
    return null;
  }

  return (
    <g data-testid="snap-guides">
      {guides.x.map((point, i) => (
        <line
          key={`x-${point.value}-${point.sourceBoxId}-${i}`}
          data-testid="snap-guide-vertical"
          x1={point.value}
          y1={0}
          x2={point.value}
          y2={viewBoxHeight}
          stroke={GUIDE_COLOR}
          strokeWidth={GUIDE_STROKE_WIDTH}
          strokeDasharray={GUIDE_DASH}
          opacity={GUIDE_OPACITY}
          pointerEvents="none"
        />
      ))}
      {guides.y.map((point, i) => (
        <line
          key={`y-${point.value}-${point.sourceBoxId}-${i}`}
          data-testid="snap-guide-horizontal"
          x1={0}
          y1={point.value}
          x2={viewBoxWidth}
          y2={point.value}
          stroke={GUIDE_COLOR}
          strokeWidth={GUIDE_STROKE_WIDTH}
          strokeDasharray={GUIDE_DASH}
          opacity={GUIDE_OPACITY}
          pointerEvents="none"
        />
      ))}
    </g>
  );
}
