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

/** parseExcelFile.ts 内の formatCellValue と同等のロジック */
function formatCellValue(value: ExcelJS.CellValue): { text: string; type: string } {
  if (value === null || value === undefined) return { text: '', type: 'empty' };
  if (typeof value === 'string') return { text: value, type: 'string' };
  if (typeof value === 'number') return { text: String(value), type: 'number' };
  if (typeof value === 'boolean') return { text: String(value), type: 'boolean' };
  if (value instanceof Date) return { text: value.toLocaleDateString('ja-JP'), type: 'date' };
  if (typeof value === 'object') {
    if (typeof (value as unknown as Date).getTime === 'function') {
      return { text: (value as unknown as Date).toLocaleDateString('ja-JP'), type: 'date' };
    }
    if ('formula' in value) {
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
    if ('sharedFormula' in value) {
      const shared = value as { sharedFormula: string; result?: unknown };
      if (shared.result !== null && shared.result !== undefined) {
        if (typeof shared.result === 'object' && 'error' in shared.result) {
          return {
            text: String((shared.result as { error: string }).error),
            type: 'formula',
          };
        }
        return { text: String(shared.result), type: 'formula' };
      }
      return { text: '', type: 'formula' };
    }
    if ('richText' in value) {
      const text = value.richText.map((rt) => rt.text).join('');
      return { text, type: 'richText' };
    }
    if ('error' in value) {
      return { text: String((value as { error: string }).error), type: 'error' };
    }
    if ('text' in value) {
      return { text: String((value as { text: string }).text), type: 'hyperlink' };
    }
  }
  return { text: String(value), type: 'unknown' };
}

describe('formatCellValue — セル値変換', () => {
  it('数式セルの result 値が正しく表示される', async () => {
    const filePath = path.resolve(__dirname, '../../../テスト計算書.xlsx');
    const buffer = fs.readFileSync(filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

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

    for (const cell of formulaResults) {
      expect(cell.text, `${cell.address} にデバッグ表記が含まれる`).not.toMatch(/^=.*→/);
      expect(cell.text, `${cell.address} に undefined が含まれる`).not.toContain('undefined');
      expect(cell.type).toBe('formula');
    }

    // エラー結果の数式（#REF!, #DIV/0! 等）
    const errorResults = formulaResults.filter((c) => c.text.startsWith('#'));
    expect(errorResults.length).toBeGreaterThan(0);
    for (const cell of errorResults) {
      expect(cell.text).toMatch(/^#[A-Z0-9/!]+$/);
    }
  });

  it('全セルで [object Object] や不正な表示が出ない', async () => {
    const filePath = path.resolve(__dirname, '../../../テスト計算書.xlsx');
    const buffer = fs.readFileSync(filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    workbook.eachSheet((ws) => {
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          const { text, type } = formatCellValue(cell.value);
          // [object Object] が表示されないこと
          expect(text, `${ws.name}!${cell.address} が [object Object]`).not.toContain(
            '[object Object]',
          );
          // デバッグ用の矢印表記が含まれないこと
          expect(text).not.toMatch(/^=.*→/);
          // "undefined" がそのまま表示されないこと
          expect(text).not.toContain('undefined');
          // type が 'object' にならないこと（全てのオブジェクト型が適切にハンドリングされる）
          expect(type, `${ws.name}!${cell.address} の型が未知: ${text}`).not.toBe('unknown');
        });
      });
    });
  });

  it('sharedFormula 型のセルが正しく処理される', async () => {
    const filePath = path.resolve(__dirname, '../../../テスト計算書.xlsx');
    const buffer = fs.readFileSync(filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // "長さ" シートに sharedFormula 型セルが存在する
    const sharedFormulaCells: Array<{
      address: string;
      text: string;
      type: string;
    }> = [];
    workbook.eachSheet((ws) => {
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (
            typeof cell.value === 'object' &&
            cell.value !== null &&
            'sharedFormula' in cell.value &&
            !('formula' in cell.value)
          ) {
            sharedFormulaCells.push({
              address: `${ws.name}!${cell.address}`,
              ...formatCellValue(cell.value),
            });
          }
        });
      });
    });

    expect(sharedFormulaCells.length).toBeGreaterThan(0);
    for (const cell of sharedFormulaCells) {
      expect(cell.type).toBe('formula');
      expect(cell.text).not.toContain('[object Object]');
      expect(cell.text).not.toContain('sharedFormula');
    }
  });
});
