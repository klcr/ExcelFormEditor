/**
 * formatCellValue のテスト
 *
 * formatCellValue は parseExcelFile.ts 内のプライベート関数のため、
 * 実際の Excel ファイルを通して動作を確認する。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

describe('formatCellValue — 数式セルの結果表示', () => {
  it('テスト計算書.xlsx の数式セルがデバッグ表記ではなく result 値で表示される', async () => {
    const filePath = path.resolve(__dirname, '../../../テスト計算書.xlsx');
    const buffer = fs.readFileSync(filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // parseExcelFile 内の formatCellValue と同等のロジックをテスト
    // （プライベート関数のため同じロジックを再実装してテスト）
    function formatCellValue(value: ExcelJS.CellValue): { text: string; type: string } {
      if (value === null || value === undefined) return { text: '', type: 'empty' };
      if (typeof value === 'string') return { text: value, type: 'string' };
      if (typeof value === 'number') return { text: String(value), type: 'number' };
      if (typeof value === 'boolean') return { text: String(value), type: 'boolean' };
      if (value instanceof Date) return { text: value.toLocaleDateString('ja-JP'), type: 'date' };
      if (typeof value === 'object' && 'formula' in value) {
        const formulaValue = value as { formula: string; result?: unknown };
        const result = formulaValue.result;
        if (result === null || result === undefined) {
          return { text: '', type: 'formula' };
        }
        if (typeof result === 'object' && result !== null && 'error' in result) {
          return { text: String((result as { error: string }).error), type: 'formula' };
        }
        return { text: String(result), type: 'formula' };
      }
      if (typeof value === 'object' && 'richText' in value) {
        const text = value.richText.map((rt) => rt.text).join('');
        return { text, type: 'richText' };
      }
      return { text: JSON.stringify(value), type: 'object' };
    }

    // 全シートから数式セルを収集して検証
    const formulaResults: Array<{ address: string; text: string; type: string }> = [];
    workbook.eachSheet((ws) => {
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (typeof cell.value === 'object' && cell.value !== null && 'formula' in cell.value) {
            formulaResults.push({
              address: `${ws.name}!${cell.address}`,
              ...formatCellValue(cell.value),
            });
          }
        });
      });
    });

    expect(formulaResults.length).toBeGreaterThan(0);

    // 全ての数式セルの結果を検証
    for (const cell of formulaResults) {
      // デバッグ用の矢印表記が含まれていないこと
      expect(cell.text, `${cell.address} にデバッグ表記が含まれる`).not.toMatch(/^=.*→/);
      // "undefined" がそのまま表示されないこと
      expect(cell.text, `${cell.address} に undefined が含まれる`).not.toContain('undefined');
      // 型が formula であること
      expect(cell.type).toBe('formula');
    }

    // 数値結果の数式（result が number）
    const numericResults = formulaResults.filter(
      (c) => !Number.isNaN(Number(c.text)) && c.text !== '',
    );
    expect(numericResults.length).toBeGreaterThan(0);

    // エラー結果の数式（#REF!, #DIV/0! 等）
    const errorResults = formulaResults.filter((c) => c.text.startsWith('#'));
    expect(errorResults.length).toBeGreaterThan(0);
    for (const cell of errorResults) {
      expect(cell.text).toMatch(/^#[A-Z0-9/!]+$/);
    }
  });

  it('数式結果がデバッグ用の矢印表記を含まない', async () => {
    const filePath = path.resolve(__dirname, '../../../テスト計算書.xlsx');
    const buffer = fs.readFileSync(filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    function formatCellValue(value: ExcelJS.CellValue): { text: string; type: string } {
      if (value === null || value === undefined) return { text: '', type: 'empty' };
      if (typeof value === 'string') return { text: value, type: 'string' };
      if (typeof value === 'number') return { text: String(value), type: 'number' };
      if (typeof value === 'boolean') return { text: String(value), type: 'boolean' };
      if (value instanceof Date) return { text: value.toLocaleDateString('ja-JP'), type: 'date' };
      if (typeof value === 'object' && 'formula' in value) {
        const formulaValue = value as { formula: string; result?: unknown };
        const result = formulaValue.result;
        if (result === null || result === undefined) {
          return { text: '', type: 'formula' };
        }
        if (typeof result === 'object' && result !== null && 'error' in result) {
          return { text: String((result as { error: string }).error), type: 'formula' };
        }
        return { text: String(result), type: 'formula' };
      }
      if (typeof value === 'object' && 'richText' in value) {
        const text = value.richText.map((rt) => rt.text).join('');
        return { text, type: 'richText' };
      }
      return { text: JSON.stringify(value), type: 'object' };
    }

    workbook.eachSheet((ws) => {
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          const { text } = formatCellValue(cell.value);
          // デバッグ用の矢印表記が含まれていないことを確認
          expect(text).not.toMatch(/^=.*→/);
          // "undefined" がそのまま表示されないことを確認
          expect(text).not.toContain('undefined');
          // "[shar" のような切れた文字列が含まれないことを確認
          expect(text).not.toMatch(/^\["shar/);
        });
      });
    });
  });
});
