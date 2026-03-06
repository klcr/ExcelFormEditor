import { describe, expect, it } from 'vitest';
import type { VariableDefinition } from './VariableTypes';
import {
  checkDuplicateNames,
  extractVariablePattern,
  validateVariableName,
} from './VariableValidation';

describe('validateVariableName', () => {
  it('有効な変数名を受け入れる', () => {
    expect(validateVariableName('name')).toEqual({ valid: true });
    expect(validateVariableName('myVar')).toEqual({ valid: true });
    expect(validateVariableName('a')).toEqual({ valid: true });
    expect(validateVariableName('camelCase')).toEqual({ valid: true });
    expect(validateVariableName('PascalCase')).toEqual({ valid: true });
    expect(validateVariableName('with_underscore')).toEqual({ valid: true });
    expect(validateVariableName('x1')).toEqual({ valid: true });
    expect(validateVariableName('abc123_def')).toEqual({ valid: true });
  });

  it('空文字列を拒否する', () => {
    const result = validateVariableName('');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('空');
    }
  });

  it('数字始まりを拒否する', () => {
    const result = validateVariableName('1abc');
    expect(result.valid).toBe(false);
  });

  it('アンダースコア始まりを拒否する', () => {
    const result = validateVariableName('_abc');
    expect(result.valid).toBe(false);
  });

  it('特殊文字を含む名前を拒否する', () => {
    expect(validateVariableName('my-var').valid).toBe(false);
    expect(validateVariableName('my.var').valid).toBe(false);
    expect(validateVariableName('my var').valid).toBe(false);
    expect(validateVariableName('my@var').valid).toBe(false);
  });

  it('64文字の名前を受け入れる', () => {
    const name = 'a'.repeat(64);
    expect(validateVariableName(name)).toEqual({ valid: true });
  });

  it('65文字以上の名前を拒否する', () => {
    const name = 'a'.repeat(65);
    const result = validateVariableName(name);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('64');
    }
  });
});

describe('extractVariablePattern', () => {
  it('単一の変数パターンを抽出する', () => {
    expect(extractVariablePattern('{{name}}')).toEqual(['name']);
  });

  it('複数の変数パターンを抽出する', () => {
    expect(extractVariablePattern('Hello {{firstName}} {{lastName}}!')).toEqual([
      'firstName',
      'lastName',
    ]);
  });

  it('テキストがない場合は空配列を返す', () => {
    expect(extractVariablePattern('')).toEqual([]);
  });

  it('変数パターンがない場合は空配列を返す', () => {
    expect(extractVariablePattern('plain text')).toEqual([]);
  });

  it('重複した変数名を除外する', () => {
    expect(extractVariablePattern('{{x}} and {{x}}')).toEqual(['x']);
  });

  it('不正な変数パターンは抽出しない', () => {
    expect(extractVariablePattern('{{1invalid}}')).toEqual([]);
    expect(extractVariablePattern('{single}')).toEqual([]);
    expect(extractVariablePattern('{{ spaces }}')).toEqual([]);
  });

  it('テキスト中に埋め込まれた変数を抽出する', () => {
    const text = '金額: {{amount}}円（税込{{taxRate}}%）';
    expect(extractVariablePattern(text)).toEqual(['amount', 'taxRate']);
  });
});

describe('checkDuplicateNames', () => {
  const makeVar = (name: string, id?: string): VariableDefinition => ({
    id: id ?? `var-${name}`,
    name,
    type: 'string',
    boxId: 'box-1',
  });

  it('重複がない場合は空配列を返す', () => {
    const variables = [makeVar('a'), makeVar('b'), makeVar('c')];
    expect(checkDuplicateNames(variables)).toEqual([]);
  });

  it('空配列の場合は空配列を返す', () => {
    expect(checkDuplicateNames([])).toEqual([]);
  });

  it('重複した名前を返す', () => {
    const variables = [makeVar('x', 'v1'), makeVar('y', 'v2'), makeVar('x', 'v3')];
    expect(checkDuplicateNames(variables)).toEqual(['x']);
  });

  it('複数の重複した名前を返す', () => {
    const variables = [
      makeVar('a', 'v1'),
      makeVar('b', 'v2'),
      makeVar('a', 'v3'),
      makeVar('b', 'v4'),
    ];
    const result = checkDuplicateNames(variables);
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).toHaveLength(2);
  });

  it('3つ以上の同名でも1回だけ返す', () => {
    const variables = [makeVar('x', 'v1'), makeVar('x', 'v2'), makeVar('x', 'v3')];
    expect(checkDuplicateNames(variables)).toEqual(['x']);
  });
});
