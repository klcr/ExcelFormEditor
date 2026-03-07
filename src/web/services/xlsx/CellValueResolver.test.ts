import { describe, expect, it } from 'vitest';
import { resolveCellValue } from './CellValueResolver';

const sharedStrings = ['Hello', 'World', '請求書', ''];

describe('resolveCellValue', () => {
  describe('共有文字列 (t="s")', () => {
    it('インデックスで共有文字列を返す', () => {
      expect(resolveCellValue('s', '0', undefined, undefined, sharedStrings)).toBe('Hello');
      expect(resolveCellValue('s', '2', undefined, undefined, sharedStrings)).toBe('請求書');
    });

    it('範囲外インデックスは空文字', () => {
      expect(resolveCellValue('s', '99', undefined, undefined, sharedStrings)).toBe('');
    });

    it('空文字列の共有文字列', () => {
      expect(resolveCellValue('s', '3', undefined, undefined, sharedStrings)).toBe('');
    });
  });

  describe('数値 (t="n" / 未指定)', () => {
    it('数値文字列をそのまま返す', () => {
      expect(resolveCellValue('n', '12345', undefined, undefined, sharedStrings)).toBe('12345');
      expect(resolveCellValue(undefined, '3.14', undefined, undefined, sharedStrings)).toBe('3.14');
    });

    it('値なしは空文字', () => {
      expect(resolveCellValue('n', undefined, undefined, undefined, sharedStrings)).toBe('');
    });
  });

  describe('ブール値 (t="b")', () => {
    it('"1" → "true"', () => {
      expect(resolveCellValue('b', '1', undefined, undefined, sharedStrings)).toBe('true');
    });

    it('"0" → "false"', () => {
      expect(resolveCellValue('b', '0', undefined, undefined, sharedStrings)).toBe('false');
    });
  });

  describe('エラー (t="e")', () => {
    it('エラー文字列を返す', () => {
      expect(resolveCellValue('e', '#REF!', undefined, undefined, sharedStrings)).toBe('#REF!');
      expect(resolveCellValue('e', '#DIV/0!', undefined, undefined, sharedStrings)).toBe('#DIV/0!');
    });
  });

  describe('インライン文字列 (t="str")', () => {
    it('値テキストを返す', () => {
      expect(resolveCellValue('str', 'inline text', undefined, undefined, sharedStrings)).toBe(
        'inline text',
      );
    });
  });

  describe('インライン文字列 (t="inlineStr")', () => {
    it('<is> のテキストを返す', () => {
      expect(resolveCellValue('inlineStr', undefined, undefined, 'is text', sharedStrings)).toBe(
        'is text',
      );
    });
  });

  describe('数式セル', () => {
    it('キャッシュ結果を返す', () => {
      expect(resolveCellValue(undefined, '42', 'A1+B1', undefined, sharedStrings)).toBe('42');
    });

    it('数式結果が文字列 (t="str")', () => {
      expect(resolveCellValue('str', 'result', 'CONCAT(A1,B1)', undefined, sharedStrings)).toBe(
        'result',
      );
    });

    it('数式結果がエラー (t="e")', () => {
      expect(resolveCellValue('e', '#NAME?', 'UNKNOWN()', undefined, sharedStrings)).toBe('#NAME?');
    });

    it('数式結果がブール (t="b")', () => {
      expect(resolveCellValue('b', '1', 'A1>0', undefined, sharedStrings)).toBe('true');
    });

    it('数式結果が空', () => {
      expect(resolveCellValue(undefined, undefined, 'SUM(A1:A5)', undefined, sharedStrings)).toBe(
        '',
      );
    });
  });

  describe('空セル', () => {
    it('全て undefined なら空文字', () => {
      expect(resolveCellValue(undefined, undefined, undefined, undefined, sharedStrings)).toBe('');
    });
  });
});
