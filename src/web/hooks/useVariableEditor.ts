import type { VariableDefinition } from '@domain/variable';
import { generateVariableId } from '@domain/variable';
import { useCallback } from 'react';
import { useUndoRedo } from './useUndoRedo';

type VariableEditorActions = {
  readonly addVariable: (variable: Omit<VariableDefinition, 'id'>) => void;
  readonly addVariables: (variables: readonly Omit<VariableDefinition, 'id'>[]) => void;
  readonly removeVariable: (variableId: string) => void;
  readonly removeVariablesByBoxId: (boxId: string) => void;
};

type UseVariableEditorReturn = {
  readonly variables: readonly VariableDefinition[];
  readonly actions: VariableEditorActions;
};

export function useVariableEditor(): UseVariableEditorReturn {
  const { current: variables, pushState } = useUndoRedo<readonly VariableDefinition[]>([]);

  const addVariable = useCallback(
    (variable: Omit<VariableDefinition, 'id'>) => {
      const newVariable: VariableDefinition = {
        ...variable,
        id: generateVariableId(),
      };
      pushState([...variables, newVariable]);
    },
    [variables, pushState],
  );

  const addVariables = useCallback(
    (newVariables: readonly Omit<VariableDefinition, 'id'>[]) => {
      const withIds: VariableDefinition[] = newVariables.map((v) => ({
        ...v,
        id: generateVariableId(),
      }));
      pushState([...variables, ...withIds]);
    },
    [variables, pushState],
  );

  const removeVariable = useCallback(
    (variableId: string) => {
      pushState(variables.filter((v) => v.id !== variableId));
    },
    [variables, pushState],
  );

  const removeVariablesByBoxId = useCallback(
    (boxId: string) => {
      pushState(variables.filter((v) => v.boxId !== boxId));
    },
    [variables, pushState],
  );

  return {
    variables,
    actions: {
      addVariable,
      addVariables,
      removeVariable,
      removeVariablesByBoxId,
    },
  };
}
