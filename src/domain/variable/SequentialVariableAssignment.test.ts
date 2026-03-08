import { beforeEach, describe, expect, it } from 'vitest';
import {
  generateSequentialVariables,
  generateVariableId,
  resetVariableIdCounter,
} from './SequentialVariableAssignment';
import type { VariableDefinition } from './VariableTypes';

describe('generateVariableId', () => {
  beforeEach(() => {
    resetVariableIdCounter();
  });

  it('連番のIDを生成する', () => {
    expect(generateVariableId()).toBe('var-1');
    expect(generateVariableId()).toBe('var-2');
    expect(generateVariableId()).toBe('var-3');
  });
});

describe('generateSequentialVariables', () => {
  beforeEach(() => {
    resetVariableIdCounter();
  });

  it('連番変数を正しく生成する', () => {
    const result = generateSequentialVariables({
      baseName: 'field',
      startIndex: 1,
      type: 'string',
      boxIds: ['box-1', 'box-2', 'box-3'],
      existingVariables: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.variables).toHaveLength(3);
    expect(result.variables[0]).toEqual({
      id: 'var-1',
      name: 'field1',
      type: 'string',
      boxId: 'box-1',
    });
    expect(result.variables[1]).toEqual({
      id: 'var-2',
      name: 'field2',
      type: 'string',
      boxId: 'box-2',
    });
    expect(result.variables[2]).toEqual({
      id: 'var-3',
      name: 'field3',
      type: 'string',
      boxId: 'box-3',
    });
  });

  it('開始番号を指定できる', () => {
    const result = generateSequentialVariables({
      baseName: 'item',
      startIndex: 5,
      type: 'number',
      boxIds: ['box-a', 'box-b'],
      existingVariables: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.variables.map((v) => v.name)).toEqual(['item5', 'item6']);
  });

  it('空のboxIdsで空配列を返す', () => {
    const result = generateSequentialVariables({
      baseName: 'field',
      startIndex: 1,
      type: 'string',
      boxIds: [],
      existingVariables: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.variables).toEqual([]);
  });

  it('無効なベース名でエラーを返す', () => {
    const result = generateSequentialVariables({
      baseName: '1invalid',
      startIndex: 1,
      type: 'string',
      boxIds: ['box-1'],
      existingVariables: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('1invalid1');
  });

  it('既存変数と重複するとエラーを返す', () => {
    const existing: VariableDefinition[] = [
      { id: 'existing-1', name: 'field2', type: 'string', boxId: 'box-x' },
    ];

    const result = generateSequentialVariables({
      baseName: 'field',
      startIndex: 1,
      type: 'string',
      boxIds: ['box-1', 'box-2', 'box-3'],
      existingVariables: existing,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('field2');
  });

  it('変数名が長すぎるとエラーを返す', () => {
    const longName = 'a'.repeat(63); // + "1" = 64文字 → OK
    const result1 = generateSequentialVariables({
      baseName: longName,
      startIndex: 1,
      type: 'string',
      boxIds: ['box-1'],
      existingVariables: [],
    });
    expect(result1.ok).toBe(true);

    const tooLongName = 'a'.repeat(64); // + "1" = 65文字 → NG
    const result2 = generateSequentialVariables({
      baseName: tooLongName,
      startIndex: 1,
      type: 'string',
      boxIds: ['box-1'],
      existingVariables: [],
    });
    expect(result2.ok).toBe(false);
  });

  it('各変数に正しいboxIdが割り当てられる', () => {
    const result = generateSequentialVariables({
      baseName: 'col',
      startIndex: 1,
      type: 'date',
      boxIds: ['box-a', 'box-b'],
      existingVariables: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.variables[0]?.boxId).toBe('box-a');
    expect(result.variables[1]?.boxId).toBe('box-b');
  });

  it('指定した型が全変数に適用される', () => {
    const result = generateSequentialVariables({
      baseName: 'val',
      startIndex: 1,
      type: 'boolean',
      boxIds: ['box-1', 'box-2'],
      existingVariables: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const v of result.variables) {
      expect(v.type).toBe('boolean');
    }
  });
});
