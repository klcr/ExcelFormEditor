import type { BoxDefinition } from '@domain/box';

type SplitDirection = 'horizontal' | 'vertical';

type SplitActionProps = {
  readonly selectedBoxIds: readonly string[];
  readonly boxes: readonly BoxDefinition[];
  readonly onSplit: (id: string, direction: SplitDirection) => void;
};

export function SplitAction({ selectedBoxIds, onSplit }: SplitActionProps) {
  if (selectedBoxIds.length !== 1) {
    return null;
  }

  const selectedId = selectedBoxIds[0] as string;

  return (
    <div data-testid="split-action">
      <button
        type="button"
        data-testid="split-horizontal"
        onClick={() => onSplit(selectedId, 'horizontal')}
      >
        水平分割
      </button>
      <button
        type="button"
        data-testid="split-vertical"
        onClick={() => onSplit(selectedId, 'vertical')}
      >
        垂直分割
      </button>
    </div>
  );
}
