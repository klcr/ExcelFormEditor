import { describe, expect, it } from 'vitest';
import {
  excelSerialToDateString,
  formatCellValue,
  isDateFormat,
  isPercentFormat,
} from './NumFmtResolver';

describe('isDateFormat', () => {
  it('日付フォーマットを検出する', () => {
    expect(isDateFormat('yyyy/mm/dd')).toBe(true);
    expect(isDateFormat('d-mmm-yy')).toBe(true);
    expect(isDateFormat('h:mm:ss')).toBe(true);
    expect(isDateFormat('yyyy"年"m"月"d"日"')).toBe(true);
  });

  it('数値フォーマットを日付と判定しない', () => {
    expect(isDateFormat('General')).toBe(false);
    expect(isDateFormat('0.00')).toBe(false);
    expect(isDateFormat('#,##0')).toBe(false);
    expect(isDateFormat('0%')).toBe(false);
  });
});

describe('isPercentFormat', () => {
  it('パーセントフォーマットを検出する', () => {
    expect(isPercentFormat('0%')).toBe(true);
    expect(isPercentFormat('0.00%')).toBe(true);
  });

  it('非パーセントフォーマットを除外する', () => {
    expect(isPercentFormat('#,##0')).toBe(false);
    expect(isPercentFormat('General')).toBe(false);
  });
});

describe('excelSerialToDateString', () => {
  it('2024/1/1 を変換する (serial=45292)', () => {
    const result = excelSerialToDateString(45292, 'yyyy/mm/dd');
    expect(result).toBe('2024/01/01');
  });

  it('1900/1/1 を変換する (serial=1)', () => {
    const result = excelSerialToDateString(1, 'yyyy/mm/dd');
    expect(result).toBe('1900/01/01');
  });

  it('1900/2/28 を変換する (serial=59)', () => {
    const result = excelSerialToDateString(59, 'yyyy/mm/dd');
    expect(result).toBe('1900/02/28');
  });

  it('1900/3/1 を変換する (serial=61、1900/2/29バグ補正)', () => {
    // serial=60 は Excel の 1900/2/29（存在しない日付）
    // serial=61 は 1900/3/1 → 補正後 serial-1=60 → 1900/3/1
    const result = excelSerialToDateString(61, 'yyyy/mm/dd');
    expect(result).toBe('1900/03/01');
  });

  it('日時フォーマットで時刻も出力する', () => {
    // 45292.5 = 2024/1/1 12:00:00
    const result = excelSerialToDateString(45292.5, 'yyyy/mm/dd h:mm:ss');
    expect(result).toBe('2024/01/01 12:00:00');
  });

  it('時刻のみ（serial < 1）', () => {
    // 0.5 = 12:00:00
    const result = excelSerialToDateString(0.5, 'h:mm:ss');
    expect(result).toBe('12:00:00');
  });
});

describe('formatCellValue', () => {
  const emptyFmts = new Map<number, string>();

  it('numFmtId=0 (General) はそのまま返す', () => {
    expect(formatCellValue('42.5', 0, emptyFmts)).toBe('42.5');
  });

  it('numFmtId=14 で日付に変換する', () => {
    const result = formatCellValue('45292', 14, emptyFmts);
    expect(result).toBe('2024/01/01');
  });

  it('numFmtId=9 でパーセントに変換する', () => {
    const result = formatCellValue('0.25', 9, emptyFmts);
    expect(result).toBe('25%');
  });

  it('numFmtId=10 で小数付きパーセントに変換する', () => {
    const result = formatCellValue('0.1234', 10, emptyFmts);
    expect(result).toBe('12.34%');
  });

  it('numFmtId=3 で桁区切りに変換する', () => {
    const result = formatCellValue('1234567', 3, emptyFmts);
    expect(result).toBe('1,234,567');
  });

  it('numFmtId=4 で桁区切り+小数に変換する', () => {
    const result = formatCellValue('1234.5', 4, emptyFmts);
    expect(result).toBe('1,234.50');
  });

  it('カスタム numFmt を使用する', () => {
    const customFmts = new Map([[164, 'yyyy/mm/dd']]);
    const result = formatCellValue('45292', 164, customFmts);
    expect(result).toBe('2024/01/01');
  });

  it('空文字はそのまま返す', () => {
    expect(formatCellValue('', 14, emptyFmts)).toBe('');
  });

  it('非数値はそのまま返す', () => {
    expect(formatCellValue('hello', 14, emptyFmts)).toBe('hello');
  });

  it('numFmtId=49 (テキスト) はそのまま返す', () => {
    expect(formatCellValue('12345', 49, emptyFmts)).toBe('12345');
  });
});
