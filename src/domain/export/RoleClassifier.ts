import type { BoxDefinition } from '@domain/box';
import type { VariableDefinition } from '@domain/variable';
import type { BoxRole } from './ExportTypes';

/** ボックスの役割を判定する */
export function classifyBoxRole(
  box: BoxDefinition,
  variables: readonly VariableDefinition[],
): BoxRole {
  const hasVariable = variables.some((v) => v.boxId === box.id);
  if (hasVariable) return 'field';
  if (box.content.trim().length > 0) return 'label';
  return 'decoration';
}
