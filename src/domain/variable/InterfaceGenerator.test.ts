import { describe, expect, it } from 'vitest';
import { generateTypeScriptInterface } from './InterfaceGenerator';
import type { VariableDefinition } from './VariableTypes';

function makeVar(name: string, type: VariableDefinition['type'] = 'string'): VariableDefinition {
  return { id: `var-${name}`, name, type, boxId: 'box-1' };
}

describe('generateTypeScriptInterface', () => {
  it('空の変数リストでは空のインターフェースを生成する', () => {
    const result = generateTypeScriptInterface('EmptyData', []);
    expect(result).toBe('interface EmptyData {}\n');
  });

  it('全4タイプの変数で正しい型を生成する', () => {
    const variables: VariableDefinition[] = [
      makeVar('customerName', 'string'),
      makeVar('totalAmount', 'number'),
      makeVar('issueDate', 'date'),
      makeVar('isPaid', 'boolean'),
    ];

    const result = generateTypeScriptInterface('InvoiceData', variables);
    expect(result).toContain('customerName: string;');
    expect(result).toContain('isPaid: boolean;');
    expect(result).toContain('issueDate: Date;');
    expect(result).toContain('totalAmount: number;');
    expect(result).toContain('interface InvoiceData {');
  });

  it('プロパティを名前のアルファベット順にソートする', () => {
    const variables: VariableDefinition[] = [
      makeVar('zebra', 'string'),
      makeVar('apple', 'number'),
      makeVar('mango', 'boolean'),
    ];

    const result = generateTypeScriptInterface('Sorted', variables);
    const lines = result.split('\n').filter((l) => l.includes(':'));
    expect(lines[0]).toContain('apple');
    expect(lines[1]).toContain('mango');
    expect(lines[2]).toContain('zebra');
  });

  it('単一の変数でもインターフェースを正しく生成する', () => {
    const result = generateTypeScriptInterface('Single', [makeVar('name')]);
    expect(result).toBe('interface Single {\n  name: string;\n}\n');
  });
});
