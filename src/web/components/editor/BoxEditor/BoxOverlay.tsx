import type { BoxDefinition } from '@domain/box';

type BoxOverlayProps = {
  readonly box: BoxDefinition;
  readonly isSelected: boolean;
  readonly onSelect: (id: string, multiSelect: boolean) => void;
};

const SELECTED_STROKE = '#2196F3';
const SELECTED_STROKE_WIDTH = 0.6;
const HOVER_FILL = 'rgba(33, 150, 243, 0.05)';

export function BoxOverlay({ box, isSelected, onSelect }: BoxOverlayProps) {
  const { x, y } = box.rect.position;
  const { width, height } = box.rect.size;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const multiSelect = e.ctrlKey || e.metaKey;
    onSelect(box.id, multiSelect);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const multiSelect = e.ctrlKey || e.metaKey;
      onSelect(box.id, multiSelect);
    }
  };

  return (
    <rect
      data-testid={`box-overlay-${box.id}`}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={isSelected ? HOVER_FILL : 'transparent'}
      stroke={isSelected ? SELECTED_STROKE : 'transparent'}
      strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : 0}
      style={{ cursor: 'pointer' }}
      tabIndex={0}
      role="button"
      aria-label={`ボックス ${box.id}`}
      aria-pressed={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
}
