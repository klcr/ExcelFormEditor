import type { BoxDefinition, SnapGuideResult } from '@domain/box';
import { BoxSvg } from '../common/BoxSvg';
import { BoxOverlay } from './BoxEditor/BoxOverlay';
import { SnapLine } from './SnapGuide/SnapLine';

type EditorCanvasProps = {
  readonly boxes: readonly BoxDefinition[];
  readonly selectedBoxIds: readonly string[];
  readonly isDragging: boolean;
  readonly activeGuides: SnapGuideResult;
  readonly onSelectBox: (id: string) => void;
  readonly onDeselectAll: () => void;
  readonly paperWidth: number;
  readonly paperHeight: number;
};

/**
 * エディタ用 SVG キャンバス。
 * ボックスオーバーレイとスナップガイド線を合成表示する。
 */
export function EditorCanvas({
  boxes,
  selectedBoxIds,
  isDragging,
  activeGuides,
  onSelectBox,
  onDeselectAll,
  paperWidth,
  paperHeight,
}: EditorCanvasProps) {
  const viewBox = `0 0 ${paperWidth} ${paperHeight}`;

  const hasGuides = activeGuides.x.length > 0 || activeGuides.y.length > 0;

  const handleBackgroundClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget) {
      onDeselectAll();
    }
  };

  const handleBoxSelect = (id: string, _multiSelect: boolean) => {
    onSelectBox(id);
  };

  return (
    <svg
      data-testid="editor-canvas"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="エディタキャンバス"
      onClick={handleBackgroundClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDeselectAll();
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <rect
        x={0}
        y={0}
        width={paperWidth}
        height={paperHeight}
        fill="white"
        stroke="#999"
        strokeWidth={0.5}
        data-testid="editor-canvas-background"
        onClick={onDeselectAll}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onDeselectAll();
        }}
      />
      {boxes.map((box) => (
        <BoxSvg key={`visual-${box.id}`} box={box} />
      ))}
      {boxes.map((box) => (
        <BoxOverlay
          key={box.id}
          box={box}
          isSelected={selectedBoxIds.includes(box.id)}
          onSelect={handleBoxSelect}
        />
      ))}
      {isDragging && hasGuides && (
        <SnapLine guides={activeGuides} viewBoxWidth={paperWidth} viewBoxHeight={paperHeight} />
      )}
    </svg>
  );
}
