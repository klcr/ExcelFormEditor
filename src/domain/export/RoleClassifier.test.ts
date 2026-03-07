import { createBox } from '@domain/box';
import type { VariableDefinition } from '@domain/variable';
import { describe, expect, it } from 'vitest';
import { classifyBoxRole } from './RoleClassifier';

function makeVariable(boxId: string): VariableDefinition {
  return { id: 'v1', name: 'testVar', type: 'string', boxId };
}

describe('classifyBoxRole', () => {
  it('returns "field" when a variable is bound to the box', () => {
    const box = createBox({
      id: 'box-1',
      rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
      content: '顧客名',
    });
    const result = classifyBoxRole(box, [makeVariable('box-1')]);
    expect(result).toBe('field');
  });

  it('returns "label" when box has content but no variable', () => {
    const box = createBox({
      id: 'box-2',
      rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
      content: '請求書番号',
    });
    const result = classifyBoxRole(box, []);
    expect(result).toBe('label');
  });

  it('returns "decoration" when box has no content and no variable', () => {
    const box = createBox({
      id: 'box-3',
      rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
    });
    const result = classifyBoxRole(box, []);
    expect(result).toBe('decoration');
  });

  it('returns "decoration" when content is whitespace only', () => {
    const box = createBox({
      id: 'box-4',
      rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
      content: '   ',
    });
    const result = classifyBoxRole(box, []);
    expect(result).toBe('decoration');
  });

  it('returns "field" even when box has no content but has a variable', () => {
    const box = createBox({
      id: 'box-5',
      rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
    });
    const result = classifyBoxRole(box, [makeVariable('box-5')]);
    expect(result).toBe('field');
  });
});
