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

  // ════════════════════════════════════════════
  // 深掘り検証A: 結合セルの罫線（結合境界の内側罫線の扱い）
  // ════════════════════════════════════════════
  describe('深掘りA: 結合セルの罫線スタイル', () => {
    // パターン1: 結合前に全セルに罫線設定 → 結合後の内側罫線
    describe('パターン1: 罫線設定後に結合（B10:D10）', () => {
      it('master セル (B10) の罫線が保持される', () => {
        const master = sheet.getCell('B10');
        expect(master.border?.top?.style).toBe('thin');
        expect(master.border?.bottom?.style).toBe('thin');
        expect(master.border?.left?.style).toBe('thin');
      });

      it('結合境界の内側セル (C10) の罫線がどうなるか確認', () => {
        const inner = sheet.getCell('C10');
        // C10 は結合範囲の内側 — 罫線情報がどう返るかを観察
        console.log('[パターン1] C10 (内側) border:', JSON.stringify(inner.border));
        console.log('[パターン1] C10 isMerged:', inner.isMerged);
        console.log('[パターン1] C10 master:', inner.master.address);
        // 事実の記録（pass/fail ではなく挙動の観察）
        expect(inner.isMerged).toBe(true);
        expect(inner.master.address).toBe('B10');
      });

      it('結合範囲の右端セル (D10) の右罫線が保持されるか確認', () => {
        const rightEdge = sheet.getCell('D10');
        console.log('[パターン1] D10 (右端) border:', JSON.stringify(rightEdge.border));
        // 結合範囲の右端なので right border は外枠として意味がある
      });
    });

    // パターン2: 先に結合 → master に罫線設定
    describe('パターン2: 結合後に master に罫線設定（B12:D13）', () => {
      it('master セル (B12) に設定した罫線が取得できる', () => {
        const master = sheet.getCell('B12');
        expect(master.border?.top?.style).toBe('medium');
        expect(master.border?.bottom?.style).toBe('medium');
        expect(master.border?.left?.style).toBe('medium');
        expect(master.border?.right?.style).toBe('medium');
        expect(master.border?.top?.color?.argb).toBe('FF0000FF');
      });

      it('slave セル (C12, D12, B13, C13, D13) の罫線を観察', () => {
        const positions = ['C12', 'D12', 'B13', 'C13', 'D13'] as const;
        for (const addr of positions) {
          const cell = sheet.getCell(addr);
          console.log(
            `[パターン2] ${addr} isMerged:${cell.isMerged}`,
            `border:${JSON.stringify(cell.border)}`,
          );
        }
        // master に設定した border が slave に伝播するか？
        const c12 = sheet.getCell('C12');
        console.log('[パターン2] C12 は master の border を継承するか:', !!c12.border);
      });

      it('外周セルの外向き罫線を確認（D12の右, B13の左, D13の右・下）', () => {
        // master にのみ border 設定した場合、実際の外枠はどのセルが持つか
        const d12 = sheet.getCell('D12');
        const b13 = sheet.getCell('B13');
        const d13 = sheet.getCell('D13');
        console.log('[パターン2] D12.right:', JSON.stringify(d12.border?.right));
        console.log('[パターン2] B13.left:', JSON.stringify(b13.border?.left));
        console.log('[パターン2] D13.right:', JSON.stringify(d13.border?.right));
        console.log('[パターン2] D13.bottom:', JSON.stringify(d13.border?.bottom));
      });
    });

    // パターン3: 外周セルに個別に罫線設定
    describe('パターン3: 外周セルに個別罫線設定（B15:D16）', () => {
      it('上辺セル (B15, C15, D15) の top 罫線が取得できる', () => {
        for (const col of [2, 3, 4]) {
          const cell = sheet.getCell(15, col);
          console.log(
            `[パターン3] ${cell.address} top:`,
            JSON.stringify(cell.border?.top),
          );
          expect(cell.border?.top?.style).toBe('thick');
          expect(cell.border?.top?.color?.argb).toBe('FFFF0000');
        }
      });

      it('下辺セル (B16, C16, D16) の bottom 罫線が取得できる', () => {
        for (const col of [2, 3, 4]) {
          const cell = sheet.getCell(16, col);
          console.log(
            `[パターン3] ${cell.address} bottom:`,
            JSON.stringify(cell.border?.bottom),
          );
          expect(cell.border?.bottom?.style).toBe('thick');
          expect(cell.border?.bottom?.color?.argb).toBe('FFFF0000');
        }
      });

      it('左辺セル (B15, B16) の left 罫線が取得できる', () => {
        for (const row of [15, 16]) {
          const cell = sheet.getCell(row, 2);
          console.log(
            `[パターン3] ${cell.address} left:`,
            JSON.stringify(cell.border?.left),
          );
          expect(cell.border?.left?.style).toBe('thick');
        }
      });

      it('右辺セル (D15, D16) の right 罫線が取得できる', () => {
        for (const row of [15, 16]) {
          const cell = sheet.getCell(row, 4);
          console.log(
            `[パターン3] ${cell.address} right:`,
            JSON.stringify(cell.border?.right),
          );
          expect(cell.border?.right?.style).toBe('thick');
        }
      });

      it('内側セル (C15, C16) の left/right 罫線を観察（内側罫線の有無）', () => {
        for (const row of [15, 16]) {
          const cell = sheet.getCell(row, 3);
          console.log(
            `[パターン3] ${cell.address} (内側)`,
            `left:${JSON.stringify(cell.border?.left)}`,
            `right:${JSON.stringify(cell.border?.right)}`,
            `top:${JSON.stringify(cell.border?.top)}`,
            `bottom:${JSON.stringify(cell.border?.bottom)}`,
          );
        }
      });
    });
  });

  // ════════════════════════════════════════════
  // 深掘り検証B: pageMargins 制約004 詳細
  // ════════════════════════════════════════════
  describe('深掘りB: pageMargins 制約004 詳細', () => {
    it('margins が未設定のシートではデフォルト値が返る', () => {
      // sheet2 (fitToPage) は margins を明示設定していない
      const margins = sheet2.pageSetup.margins;
      console.log('[制約004] sheet2 (未設定) margins:', JSON.stringify(margins));
      // ExcelJS のデフォルト値を確認
      if (margins) {
        // Excel 既定値: top/bottom=0.75, left/right=0.7, header/footer=0.3
        // ExcelJS が何を返すかを観察
        console.log(
          `  top=${margins.top}, bottom=${margins.bottom},`,
          `left=${margins.left}, right=${margins.right},`,
          `header=${margins.header}, footer=${margins.footer}`,
        );
      }
      expect(margins).toBeDefined();
    });

    it('mm 変換が制約004の計算式と一致する', () => {
      const margins = sheet.pageSetup.margins;
      if (!margins) throw new Error('margins が未定義');

      // 制約004: marginMm = marginInches × 25.4
      const topMm = margins.top * 25.4;
      const bottomMm = margins.bottom * 25.4;
      const leftMm = margins.left * 25.4;
      const rightMm = margins.right * 25.4;

      // A4 = 210 x 297 mm
      const printableWidth = 210 - (margins.left + margins.right) * 25.4;
      const printableHeight = 297 - (margins.top + margins.bottom) * 25.4;

      console.log(`[制約004] topMm=${topMm}, bottomMm=${bottomMm}, leftMm=${leftMm}, rightMm=${rightMm}`);
      console.log(`[制約004] printableArea: ${printableWidth.toFixed(1)} x ${printableHeight.toFixed(1)} mm`);

      expect(topMm).toBeCloseTo(0.8 * 25.4, 2);
      expect(printableWidth).toBeGreaterThan(0);
      expect(printableHeight).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════
  // 深掘り検証C: pageSetup scale / fitToPage 制約003 詳細
  // ════════════════════════════════════════════
  describe('深掘りC: pageSetup scale / fitToPage 制約003 詳細', () => {
    it('scale モードと fitToPage モードが排他的に取得できる', () => {
      // sheet1: scale=80, fitToPage は未設定
      console.log('[制約003] sheet1: scale=', sheet.pageSetup.scale, 'fitToPage=', sheet.pageSetup.fitToPage);
      expect(sheet.pageSetup.scale).toBe(80);
      // fitToPage が false または undefined であることを確認
      expect(sheet.pageSetup.fitToPage).toBeFalsy();

      // sheet2: fitToPage=true
      console.log('[制約003] sheet2: scale=', sheet2.pageSetup.scale, 'fitToPage=', sheet2.pageSetup.fitToPage);
      expect(sheet2.pageSetup.fitToPage).toBe(true);
    });

    it('fitToPage の fitToWidth / fitToHeight が取得できる', () => {
      expect(sheet2.pageSetup.fitToWidth).toBe(1);
      expect(sheet2.pageSetup.fitToHeight).toBe(0);
      console.log(
        '[制約003] fitToWidth=', sheet2.pageSetup.fitToWidth,
        'fitToHeight=', sheet2.pageSetup.fitToHeight,
      );
    });

    it('scale=0 や未設定時のフォールバック値を確認', () => {
      // scale 未設定のシート (sheet2) で scale がどう返るか
      const scaleValue = sheet2.pageSetup.scale;
      console.log('[制約003] fitToPage シートの scale 値:', scaleValue);
      // 制約003: scale 0 or invalid → effectiveScale = 1.0
      // ExcelJS がどの値を返すかを記録
    });

    it('effectiveScale の計算が制約003の定義と整合する', () => {
      // scale モード: effectiveScale = scale / 100
      const scale1 = sheet.pageSetup.scale;
      if (scale1 !== undefined) {
        const effectiveScale = scale1 / 100;
        expect(effectiveScale).toBe(0.8);
        console.log('[制約003] scale mode: effectiveScale =', effectiveScale);
      }

      // fitToPage モード: effectiveScale = min(fitToWidth比, fitToHeight比)
      // ※ 実際の計算にはコンテンツサイズが必要なので、API として値が取れることの確認のみ
      console.log('[制約003] fitToPage mode: fitToWidth=', sheet2.pageSetup.fitToWidth);
      expect(sheet2.pageSetup.fitToWidth).toBeGreaterThanOrEqual(0);
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
