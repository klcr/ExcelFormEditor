import type { BoxDefinition } from '@domain/box';
import { PositionSizeSection } from './PositionSizeSection';
import styles from './PropertyPanel.module.css';

type PropertyPanelProps = {
  readonly selectedBoxIds: readonly string[];
  readonly boxes: readonly BoxDefinition[];
  readonly onMove: (delta: { x: number; y: number }) => void;
  readonly onResize: (id: string, newSize: { width: number; height: number }) => void;
};

export function PropertyPanel({ selectedBoxIds, boxes, onMove, onResize }: PropertyPanelProps) {
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

  return (
    <div className={styles.panel}>
      <PositionSizeSection
        box={selectedBox}
        onPositionChange={handlePositionChange}
        onSizeChange={handleSizeChange}
      />
    </div>
  );
}
