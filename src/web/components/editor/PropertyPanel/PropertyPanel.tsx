import type {
  BoxAlignment,
  BoxBorder,
  BoxDefinition,
  BoxFill,
  BoxFont,
  BoxPadding,
} from '@domain/box';
import type { VariableDefinition } from '@domain/variable';
import { BorderSection } from './BorderSection';
import { FillSection } from './FillSection';
import { PaddingSection } from './PaddingSection';
import { PositionSizeSection } from './PositionSizeSection';
import styles from './PropertyPanel.module.css';
import { TextStyleSection } from './TextStyleSection';
import { VariableBindingSection } from './VariableBindingSection';

type PropertyPanelProps = {
  readonly selectedBoxIds: readonly string[];
  readonly boxes: readonly BoxDefinition[];
  readonly onMove: (delta: { x: number; y: number }) => void;
  readonly onResize: (id: string, newSize: { width: number; height: number }) => void;
  readonly onUpdateBox?: (id: string, partial: Partial<BoxDefinition>) => void;
  readonly variables?: readonly VariableDefinition[];
  readonly onAddVariable?: (variable: Omit<VariableDefinition, 'id'>) => void;
  readonly onRemoveVariable?: (variableId: string) => void;
};

export function PropertyPanel({
  selectedBoxIds,
  boxes,
  onMove,
  onResize,
  onUpdateBox,
  variables = [],
  onAddVariable,
  onRemoveVariable,
}: PropertyPanelProps) {
  if (selectedBoxIds.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyState}>ボックスを選択してください</p>
      </div>
    );
  }

  if (selectedBoxIds.length > 1) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyState}>{selectedBoxIds.length}個のボックスを選択中</p>
      </div>
    );
  }

  const selectedBox = boxes.find((b) => b.id === selectedBoxIds[0]);
  if (!selectedBox) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyState}>ボックスを選択してください</p>
      </div>
    );
  }

  const handlePositionChange = (newPosition: { x: number; y: number }) => {
    const delta = {
      x: newPosition.x - selectedBox.rect.position.x,
      y: newPosition.y - selectedBox.rect.position.y,
    };
    onMove(delta);
  };

  const handleSizeChange = (newSize: { width: number; height: number }) => {
    onResize(selectedBox.id, newSize);
  };

  const handleBorderChange = (newBorder: BoxBorder) => {
    onUpdateBox?.(selectedBox.id, { border: newBorder });
  };

  const handleFontChange = (newFont: BoxFont) => {
    onUpdateBox?.(selectedBox.id, { font: newFont });
  };

  const handleAlignmentChange = (newAlignment: BoxAlignment) => {
    onUpdateBox?.(selectedBox.id, { alignment: newAlignment });
  };

  const handleFillChange = (newFill: BoxFill | undefined) => {
    onUpdateBox?.(selectedBox.id, { fill: newFill });
  };

  const handlePaddingChange = (newPadding: BoxPadding) => {
    onUpdateBox?.(selectedBox.id, { padding: newPadding });
  };

  return (
    <div className={styles.panel}>
      <PositionSizeSection
        box={selectedBox}
        onPositionChange={handlePositionChange}
        onSizeChange={handleSizeChange}
      />
      <BorderSection border={selectedBox.border} onChange={handleBorderChange} />
      <TextStyleSection
        font={selectedBox.font}
        alignment={selectedBox.alignment}
        onFontChange={handleFontChange}
        onAlignmentChange={handleAlignmentChange}
      />
      <FillSection fill={selectedBox.fill} onChange={handleFillChange} />
      <PaddingSection padding={selectedBox.padding} onChange={handlePaddingChange} />
      {onAddVariable && onRemoveVariable && (
        <VariableBindingSection
          boxId={selectedBox.id}
          variables={variables}
          onAdd={onAddVariable}
          onRemove={onRemoveVariable}
        />
      )}
    </div>
  );
}
