import type { VariableDefinition } from './VariableTypes';

/** 変数名のバリデーションパターン: 英字始まり、英数字とアンダースコアのみ */
const VARIABLE_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/** 変数名の最大長 */
const MAX_VARIABLE_NAME_LENGTH = 64;

/** テンプレート内の変数パターン: {{variableName}} */
const VARIABLE_TEMPLATE_PATTERN = /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;

/** バリデーション結果 */
export type VariableNameValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string };

/**
 * 変数名のバリデーション
 * - 英字で始まり、英数字とアンダースコアのみ許可
 * - 最大64文字
 */
export function validateVariableName(name: string): VariableNameValidation {
  if (name.length === 0) {
    return { valid: false, reason: '変数名が空です' };
  }

  if (name.length > MAX_VARIABLE_NAME_LENGTH) {
    return {
      valid: false,
      reason: `変数名は${MAX_VARIABLE_NAME_LENGTH}文字以内にしてください（現在: ${name.length}文字）`,
    };
  }

  if (!VARIABLE_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      reason: '変数名は英字で始まり、英数字とアンダースコアのみ使用できます',
    };
  }

  return { valid: true };
}

/**
 * テキスト中の {{variableName}} パターンから変数名を抽出する
 */
export function extractVariablePattern(text: string): string[] {
  const matches: string[] = [];

  for (const match of text.matchAll(VARIABLE_TEMPLATE_PATTERN)) {
    const name = match[1];
    if (name !== undefined && !matches.includes(name)) {
      matches.push(name);
    }
  }

  return matches;
}

/**
 * 変数定義リスト内の重複した名前を返す
 */
export function checkDuplicateNames(variables: readonly VariableDefinition[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const variable of variables) {
    if (seen.has(variable.name)) {
      duplicates.add(variable.name);
    }
    seen.add(variable.name);
  }

  return [...duplicates];
}
