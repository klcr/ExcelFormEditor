/**
 * ExcelJS PoC テスト
 *
 * 制約 001〜004 および X-2 で必要な情報が ExcelJS の API で取得できるかを検証する。
 * createTestWorkbook() で生成したバッファを読み戻し、各項目をアサーションする。
 */
import ExcelJS from 'exceljs';
import { describe, expect, it, beforeAll } from 'vitest';
import { createTestWorkbook } from './fixtures/createTestWorkbook';

describe('ExcelJS PoC', () => {
  let workbook: ExcelJS.Workbook;
  let sheet: ExcelJS.Worksheet;
  let sheet2: ExcelJS.Worksheet;

  beforeAll(async () => {
    const buffer = await createTestWorkbook();
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const ws1 = workbook.getWorksheet('帳票サンプル');
    const ws2 = workbook.getWorksheet('fitToPage');
    if (!ws1 || !ws2) {
      throw new Error('ワークシートが見つかりません');
    }
    sheet = ws1;
    sheet2 = ws2;
  });

  // ────────────────────────────────────────────
  // 検証項目 1: pageMargins（制約004）
  // ────────────────────────────────────────────
  describe('検証1: pageMargins（制約004）', () => {
    it('6属性がインチ単位で取得できる', () => {
      const margins = sheet.pageSetup.margins;
      expect(margins).toBeDefined();

      if (!margins) return;
      expect(margins.top).toBeCloseTo(0.8, 2);
      expect(margins.bottom).toBeCloseTo(0.6, 2);
      expect(margins.left).toBeCloseTo(0.5, 2);
      expect(margins.right).toBeCloseTo(0.5, 2);
      expect(margins.header).toBeCloseTo(0.3, 2);
      expect(margins.footer).toBeCloseTo(0.25, 2);
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 2: pageSetup（制約003）
  // ────────────────────────────────────────────
  describe('検証2: pageSetup（制約003）', () => {
    it('scale が取得できる', () => {
      expect(sheet.pageSetup.scale).toBe(80);
    });

    it('orientation が取得できる', () => {
      expect(sheet.pageSetup.orientation).toBe('portrait');
    });

    it('paperSize が取得できる（A4 = 9）', () => {
      expect(sheet.pageSetup.paperSize).toBe(9);
    });

    it('fitToPage 設定が取得できる（sheet2）', () => {
      expect(sheet2.pageSetup.fitToPage).toBe(true);
      expect(sheet2.pageSetup.fitToWidth).toBe(1);
      expect(sheet2.pageSetup.fitToHeight).toBe(0);
      expect(sheet2.pageSetup.orientation).toBe('landscape');
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 3: 列幅・行高（制約001）
  // ────────────────────────────────────────────
  describe('検証3: 列幅・行高（制約001）', () => {
    it('列幅が文字数単位で取得できる', () => {
      expect(sheet.getColumn(1).width).toBeCloseTo(8.43, 1);
      expect(sheet.getColumn(2).width).toBeCloseTo(15, 1);
      expect(sheet.getColumn(3).width).toBeCloseTo(20, 1);
      expect(sheet.getColumn(4).width).toBeCloseTo(12, 1);
      expect(sheet.getColumn(5).width).toBeCloseTo(10, 1);
    });

    it('行高がpt単位で取得できる', () => {
      expect(sheet.getRow(1).height).toBeCloseTo(20, 1);
      expect(sheet.getRow(2).height).toBeCloseTo(15, 1);
      expect(sheet.getRow(3).height).toBeCloseTo(25, 1);
      expect(sheet.getRow(4).height).toBeCloseTo(18, 1);
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 4: セル結合（X-2）
  // ────────────────────────────────────────────
  describe('検証4: セル結合（X-2）', () => {
    it('結合セル情報が取得できる', () => {
      // ExcelJS の _merges は内部プロパティだが、model 経由で結合情報を確認
      const merges = sheet.model.merges;
      expect(merges).toBeDefined();
      expect(merges?.length).toBeGreaterThanOrEqual(3);
    });

    it('結合セルの範囲が正しい', () => {
      const merges = sheet.model.merges ?? [];
      // ExcelJS は merges を "A1:C1" 形式の文字列配列で返す
      expect(merges).toContain('A1:C1');
      expect(merges).toContain('D2:D4');
      expect(merges).toContain('E5:G7');
    });

    it('結合セルの master が取得できる', () => {
      const cellB1 = sheet.getCell('B1');
      // B1 は A1:C1 の結合範囲内なので、master は A1
      expect(cellB1.isMerged).toBe(true);
      expect(cellB1.master.address).toBe('A1');
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 5: 罫線スタイル（X-2）
  // ────────────────────────────────────────────
  describe('検証5: 罫線スタイル（X-2）', () => {
    it('実線罫線（thin）が取得できる', () => {
      const cell = sheet.getCell('A5');
      expect(cell.border?.top?.style).toBe('thin');
      expect(cell.border?.top?.color?.argb).toBe('FF000000');
    });

    it('二重線罫線（double）が取得できる', () => {
      const cell = sheet.getCell('A6');
      expect(cell.border?.top?.style).toBe('double');
      expect(cell.border?.top?.color?.argb).toBe('FF0000FF');
    });

    it('破線罫線（dashed）が取得できる', () => {
      const cell = sheet.getCell('A7');
      expect(cell.border?.top?.style).toBe('dashed');
      expect(cell.border?.top?.color?.argb).toBe('FFFF0000');
    });

    it('4辺すべての罫線情報が取得できる', () => {
      const cell = sheet.getCell('A5');
      expect(cell.border?.top).toBeDefined();
      expect(cell.border?.bottom).toBeDefined();
      expect(cell.border?.left).toBeDefined();
      expect(cell.border?.right).toBeDefined();
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 6: セル値（X-2）
  // ────────────────────────────────────────────
  describe('検証6: セル値（X-2）', () => {
    it('文字列が取得できる', () => {
      const cell = sheet.getCell('A1');
      expect(cell.value).toBe('請求書');
    });

    it('数値が取得できる', () => {
      const cell = sheet.getCell('B2');
      expect(cell.value).toBe(12345);
    });

    it('日付が取得できる', () => {
      const cell = sheet.getCell('C2');
      const value = cell.value;
      expect(value).toBeInstanceOf(Date);
      if (value instanceof Date) {
        expect(value.getFullYear()).toBe(2026);
        expect(value.getMonth()).toBe(2); // 3月 = index 2
        expect(value.getDate()).toBe(6);
      }
    });

    it('数式セルの計算結果が取得できる', () => {
      const cell = sheet.getCell('B3');
      const value = cell.value;
      // ExcelJS は数式を { formula, result } オブジェクトとして返す
      if (typeof value === 'object' && value !== null && 'result' in value) {
        expect((value as ExcelJS.CellFormulaValue).result).toBe(24690);
        expect((value as ExcelJS.CellFormulaValue).formula).toBe('B2*2');
      } else {
        // 数式が直接値として返る場合もある
        expect(value).toBe(24690);
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 7: フォント情報
  // ────────────────────────────────────────────
  describe('検証7: フォント情報', () => {
    it('フォント名・サイズ・太字が取得できる', () => {
      const cell = sheet.getCell('A1');
      expect(cell.font?.name).toBe('MS Gothic');
      expect(cell.font?.size).toBe(16);
      expect(cell.font?.bold).toBe(true);
    });

    it('フォント色が取得できる', () => {
      const cell = sheet.getCell('A1');
      expect(cell.font?.color?.argb).toBe('FF000000');
    });

    it('イタリック・色が取得できる', () => {
      const cell = sheet.getCell('B4');
      expect(cell.font?.bold).toBe(true);
      expect(cell.font?.italic).toBe(true);
      expect(cell.font?.size).toBe(12);
      expect(cell.font?.color?.argb).toBe('FFFF0000');
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 8: 背景色・塗りつぶし
  // ────────────────────────────────────────────
  describe('検証8: 背景色・塗りつぶし', () => {
    it('パターン塗りつぶしが取得できる', () => {
      const cell = sheet.getCell('C4');
      const fill = cell.fill;
      expect(fill).toBeDefined();
      if (fill && 'pattern' in fill) {
        expect(fill.type).toBe('pattern');
        expect(fill.pattern).toBe('solid');
        expect(fill.fgColor?.argb).toBe('FFFFFF00');
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 9: 印刷範囲
  // ────────────────────────────────────────────
  describe('検証9: 印刷範囲', () => {
    it('printArea が取得できる', () => {
      const printArea = sheet.pageSetup.printArea;
      expect(printArea).toBeDefined();
      // ExcelJS は printArea を文字列で返す
      expect(printArea).toContain('A1');
      expect(printArea).toContain('H20');
    });
  });

  // ────────────────────────────────────────────
  // 追加検証: アライメント情報
  // ────────────────────────────────────────────
  describe('追加検証: アライメント', () => {
    it('水平・垂直アライメントが取得できる', () => {
      const cell = sheet.getCell('A1');
      expect(cell.alignment?.horizontal).toBe('center');
      expect(cell.alignment?.vertical).toBe('middle');
    });
  });

  // ────────────────────────────────────────────
  // 追加検証: ワークシート列挙
  // ────────────────────────────────────────────
  describe('追加検証: ワークシート列挙', () => {
    it('全シートを列挙できる', () => {
      const sheetNames: string[] = [];
      workbook.eachSheet((ws) => {
        sheetNames.push(ws.name);
      });
      expect(sheetNames).toContain('帳票サンプル');
      expect(sheetNames).toContain('fitToPage');
      expect(sheetNames.length).toBe(2);
    });
  });

  // ────────────────────────────────────────────
  // 追加検証: 行・セルのイテレーション
  // ────────────────────────────────────────────
  describe('追加検証: 行・セルのイテレーション', () => {
    it('eachRow でデータ行を走査できる', () => {
      const rowNumbers: number[] = [];
      sheet.eachRow({ includeEmpty: false }, (row) => {
        rowNumbers.push(row.number);
      });
      expect(rowNumbers.length).toBeGreaterThan(0);
      expect(rowNumbers).toContain(1);
    });

    it('eachCell でセルを走査できる', () => {
      const row = sheet.getRow(1);
      const cellAddresses: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        cellAddresses.push(cell.address);
      });
      expect(cellAddresses.length).toBeGreaterThan(0);
    });
  });
});
