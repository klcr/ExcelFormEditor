import type { BoxDefinition } from '@domain/box';
import { validateMerge } from '@domain/box';

type MergeActionProps = {
  readonly selectedBoxIds: readonly string[];
  readonly boxes: readonly BoxDefinition[];
  readonly onMerge: () => void;
};

export function MergeAction({ selectedBoxIds, boxes, onMerge }: MergeActionProps) {
  if (selectedBoxIds.length < 2) {
    return null;
  }

  const selectedBoxes = boxes.filter((b) => selectedBoxIds.includes(b.id));
  const validation = validateMerge(selectedBoxes);
  const isValid = validation.valid;

  return (
    <div data-testid="merge-action">
      <button type="button" data-testid="merge-button" disabled={!isValid} onClick={onMerge}>
        結合
      </button>
    </div>
  );
}
