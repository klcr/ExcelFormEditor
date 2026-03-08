import type { VariableDefinition, VariableType } from './VariableTypes';
import { checkDuplicateNames, validateVariableName } from './VariableValidation';

let variableCounter = 0;

/** 一意な Variable ID を生成する */
export function generateVariableId(): string {
  variableCounter++;
  return `var-${variableCounter}`;
}

/** テスト用: カウンタリセット */
export function resetVariableIdCounter(): void {
  variableCounter = 0;
}

type GenerateSequentialVariablesParams = {
  readonly baseName: string;
  readonly startIndex: number;
  readonly type: VariableType;
  readonly boxIds: readonly string[];
  readonly existingVariables: readonly VariableDefinition[];
};

type GenerateSequentialVariablesResult =
  | { readonly ok: true; readonly variables: readonly VariableDefinition[] }
  | { readonly ok: false; readonly error: string };

/**
 * 連番変数を一括生成する。
 * boxIds の順序に対応して baseName + 連番の変数を割り当てる。
 */
export function generateSequentialVariables(
  params: GenerateSequentialVariablesParams,
): GenerateSequentialVariablesResult {
  const { baseName, startIndex, type, boxIds, existingVariables } = params;

  if (boxIds.length === 0) {
    return { ok: true, variables: [] };
  }

  // 生成する変数名を作成
  const names: string[] = [];
  for (let i = 0; i < boxIds.length; i++) {
    names.push(`${baseName}${startIndex + i}`);
  }

  // 各変数名をバリデーション
  for (const name of names) {
    const validation = validateVariableName(name);
    if (!validation.valid) {
      return { ok: false, error: `${name}: ${validation.reason}` };
    }
  }

  // 既存変数との重複チェック
  const allVariables: VariableDefinition[] = [
    ...existingVariables,
    ...names.map((name, i) => ({
      id: `temp-${i}`,
      name,
      type,
      boxId: boxIds[i] ?? '',
    })),
  ];

  const duplicates = checkDuplicateNames(allVariables);
  if (duplicates.length > 0) {
    return {
      ok: false,
      error: `変数名が重複しています: ${duplicates.join(', ')}`,
    };
  }

  // 変数を生成
  const variables: VariableDefinition[] = names.map((name, i) => ({
    id: generateVariableId(),
    name,
    type,
    boxId: boxIds[i] ?? '',
  }));

  return { ok: true, variables };
}
