/**
 * SheetJS PoC テスト
 *
 * 制約 001〜004 および X-2 で必要な情報が SheetJS (xlsx) の API で取得できるかを検証する。
 * ExcelJS で生成した同一バッファを SheetJS で読み込み、各項目をアサーションする。
 *
 * SheetJS コミュニティ版の制限事項:
 * - セルスタイル（罫線・フォント・塗りつぶし）は cellStyles:true オプションで試行
 * - pageSetup の読み取り対応は要実測
 */
import * as XLSX from 'xlsx';
import { describe, expect, it, beforeAll } from 'vitest';
import { createTestWorkbook } from './fixtures/createTestWorkbook';

// SheetJS の型補助
type WorkSheet = XLSX.WorkSheet;
type CellObject = XLSX.CellObject;

/** SheetJS でセルを取得するヘルパー */
function getCell(ws: WorkSheet, address: string): CellObject | undefined {
  return ws[address] as CellObject | undefined;
}

/** SheetJS のセルアドレスを生成するヘルパー（0-indexed row, col） */
function encodeCellAddress(row: number, col: number): string {
  return XLSX.utils.encode_cell({ r: row, c: col });
}

describe('SheetJS PoC', () => {
  // 通常読み込み（スタイルなし）
  let wb: XLSX.WorkBook;
  let sheet: WorkSheet;
  let sheet2: WorkSheet;

  // cellStyles:true で読み込み（スタイル取得を試行）
  let wbStyled: XLSX.WorkBook;
  let sheetStyled: WorkSheet;

  beforeAll(async () => {
    const buffer = await createTestWorkbook();
    const arrayBuffer = new Uint8Array(buffer);

    // 通常読み込み
    wb = XLSX.read(arrayBuffer, { type: 'array' });
    const ws1 = wb.Sheets[wb.SheetNames[0]];
    const ws2 = wb.Sheets[wb.SheetNames[1]];
    if (!ws1 || !ws2) {
      throw new Error('ワークシートが見つかりません');
    }
    sheet = ws1;
    sheet2 = ws2;

    // cellStyles:true で読み込み（スタイル情報の取得を試行）
    wbStyled = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
    const wsStyled1 = wbStyled.Sheets[wbStyled.SheetNames[0]];
    if (!wsStyled1) {
      throw new Error('スタイル付きワークシートが見つかりません');
    }
    sheetStyled = wsStyled1;
  });

  // ────────────────────────────────────────────
  // 検証項目 1: pageMargins（制約004）
  // ────────────────────────────────────────────
  describe('検証1: pageMargins（制約004）', () => {
    it('6属性がインチ単位で取得できる', () => {
      const margins = sheet['!margins'];
      console.log('[SheetJS] !margins:', JSON.stringify(margins));
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
    it('シートのプロパティ構造を調査する', () => {
      // SheetJS のシートオブジェクトに含まれるキーを全列挙
      const keys = Object.keys(sheet).filter(k => k.startsWith('!'));
      console.log('[SheetJS] sheet1 の !プロパティ一覧:', keys);

      const keys2 = Object.keys(sheet2).filter(k => k.startsWith('!'));
      console.log('[SheetJS] sheet2 の !プロパティ一覧:', keys2);

      // cellStyles:true で読んだ場合
      const keysStyled = Object.keys(sheetStyled).filter(k => k.startsWith('!'));
      console.log('[SheetJS] sheet1 (cellStyles) の !プロパティ一覧:', keysStyled);
    });

    it('scale が取得できるか検証', () => {
      // SheetJS は !pageSetup プロパティとして格納する可能性がある
      const pageSetup = (sheet as Record<string, unknown>)['!pageSetup'];
      console.log('[SheetJS] sheet1 !pageSetup:', JSON.stringify(pageSetup));

      if (pageSetup && typeof pageSetup === 'object') {
        const ps = pageSetup as Record<string, unknown>;
        console.log('[SheetJS] scale:', ps.scale);
        // scale が取得できればアサーション
        if (ps.scale !== undefined) {
          expect(Number(ps.scale)).toBe(80);
        } else {
          console.log('[SheetJS] ⚠ scale プロパティが存在しない');
        }
      } else {
        console.log('[SheetJS] ⚠ !pageSetup が存在しない — 代替プロパティを探索');
        // 代替: ワークブックの Workbook.Sheets プロパティなど
        const sheetProps = (wb as Record<string, unknown>).Workbook;
        console.log('[SheetJS] wb.Workbook:', JSON.stringify(sheetProps, null, 2)?.substring(0, 500));
      }
    });

    it('orientation が取得できるか検証', () => {
      const pageSetup = (sheet as Record<string, unknown>)['!pageSetup'];
      if (pageSetup && typeof pageSetup === 'object') {
        const ps = pageSetup as Record<string, unknown>;
        console.log('[SheetJS] orientation:', ps.orientation);
        if (ps.orientation !== undefined) {
          expect(ps.orientation).toBe('portrait');
        }
      }
    });

    it('paperSize が取得できるか検証（A4 = 9）', () => {
      const pageSetup = (sheet as Record<string, unknown>)['!pageSetup'];
      if (pageSetup && typeof pageSetup === 'object') {
        const ps = pageSetup as Record<string, unknown>;
        console.log('[SheetJS] paperSize:', ps.paperSize);
        if (ps.paperSize !== undefined) {
          expect(Number(ps.paperSize)).toBe(9);
        }
      }
    });

    it('fitToPage 設定が取得できるか検証（sheet2）', () => {
      const pageSetup2 = (sheet2 as Record<string, unknown>)['!pageSetup'];
      console.log('[SheetJS] sheet2 !pageSetup:', JSON.stringify(pageSetup2));

      if (pageSetup2 && typeof pageSetup2 === 'object') {
        const ps = pageSetup2 as Record<string, unknown>;
        console.log('[SheetJS] fitToPage:', ps.fitToPage, 'fitToWidth:', ps.fitToWidth, 'fitToHeight:', ps.fitToHeight);
      }

      // Workbook.Sheets にシート設定がある可能性も調査
      const wbObj = wb as Record<string, unknown>;
      if (wbObj.Workbook && typeof wbObj.Workbook === 'object') {
        const workbook = wbObj.Workbook as Record<string, unknown>;
        if (workbook.Sheets && Array.isArray(workbook.Sheets)) {
          console.log('[SheetJS] Workbook.Sheets[1] (fitToPage sheet):', JSON.stringify(workbook.Sheets[1]));
        }
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 3: 列幅・行高（制約001）
  // ────────────────────────────────────────────
  describe('検証3: 列幅・行高（制約001）', () => {
    it('列幅が取得できる（通常読み込みでは不可、cellStyles:true で可能）', () => {
      const colsDefault = sheet['!cols'];
      console.log('[SheetJS] !cols (通常):', JSON.stringify(colsDefault));
      console.log('[SheetJS] ⚠ 通常読み込みでは !cols が undefined');

      // cellStyles:true で読んだ場合
      const cols = sheetStyled['!cols'];
      console.log('[SheetJS] !cols (cellStyles):', JSON.stringify(cols));
      expect(cols).toBeDefined();

      if (!cols) return;
      // SheetJS の列幅は wch（文字数）または wpx（ピクセル）で格納
      // ExcelJS で設定した値: 8.43, 15, 20, 12, 10
      for (let i = 0; i < 5; i++) {
        const col = cols[i];
        console.log(`[SheetJS] col[${i}]:`, JSON.stringify(col));
      }

      // wch プロパティで文字数単位の幅が取得できるか
      if (cols[0]?.wch !== undefined) {
        expect(cols[0].wch).toBeCloseTo(8.43, 0);
        expect(cols[1]?.wch).toBeCloseTo(15, 0);
        expect(cols[2]?.wch).toBeCloseTo(20, 0);
        expect(cols[3]?.wch).toBeCloseTo(12, 0);
        expect(cols[4]?.wch).toBeCloseTo(10, 0);
      } else if (cols[0]?.width !== undefined) {
        console.log('[SheetJS] width プロパティで取得:', cols.map(c => c?.width));
      }
    });

    it('行高がpt単位で取得できる（通常読み込みでは不可、cellStyles:true で可能）', () => {
      const rowsDefault = sheet['!rows'];
      console.log('[SheetJS] !rows (通常):', JSON.stringify(rowsDefault));
      console.log('[SheetJS] ⚠ 通常読み込みでは !rows が undefined');

      // cellStyles:true で読んだ場合
      const rows = sheetStyled['!rows'];
      console.log('[SheetJS] !rows (cellStyles):', JSON.stringify(rows));
      expect(rows).toBeDefined();

      if (!rows) return;
      // SheetJS の行高は hpt（ポイント）または hpx（ピクセル）で格納
      // ExcelJS で設定した値: row1=20, row2=15, row3=25, row4=18
      for (let i = 0; i < 4; i++) {
        const row = rows[i];
        console.log(`[SheetJS] row[${i}]:`, JSON.stringify(row));
      }

      if (rows[0]?.hpt !== undefined) {
        expect(rows[0].hpt).toBeCloseTo(20, 1);
        expect(rows[1]?.hpt).toBeCloseTo(15, 1);
        expect(rows[2]?.hpt).toBeCloseTo(25, 1);
        expect(rows[3]?.hpt).toBeCloseTo(18, 1);
      } else if (rows[0]?.hpx !== undefined) {
        console.log('[SheetJS] hpx (ピクセル) で取得:', rows.map(r => r?.hpx));
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 4: セル結合（X-2）
  // ────────────────────────────────────────────
  describe('検証4: セル結合（X-2）', () => {
    it('結合セル情報が取得できる', () => {
      const merges = sheet['!merges'];
      console.log('[SheetJS] !merges:', JSON.stringify(merges));
      expect(merges).toBeDefined();
      expect(merges?.length).toBeGreaterThanOrEqual(3);
    });

    it('結合セルの範囲が正しい', () => {
      const merges = sheet['!merges'] ?? [];
      // SheetJS は {s:{r,c}, e:{r,c}} 形式で返す
      // A1:C1 → {s:{r:0,c:0}, e:{r:0,c:2}}
      // D2:D4 → {s:{r:1,c:3}, e:{r:3,c:3}}
      // E5:G7 → {s:{r:4,c:4}, e:{r:6,c:6}}
      const rangeStrings = merges.map(m => XLSX.utils.encode_range(m));
      console.log('[SheetJS] merge ranges:', rangeStrings);

      expect(rangeStrings).toContain('A1:C1');
      expect(rangeStrings).toContain('D2:D4');
      expect(rangeStrings).toContain('E5:G7');
    });

    it('結合セルの master/slave 関係を確認', () => {
      // SheetJS は結合範囲内の slave セルをどう扱うか
      const cellB1 = getCell(sheet, 'B1');
      console.log('[SheetJS] B1 (結合範囲内):', JSON.stringify(cellB1));
      // SheetJS では結合範囲内のスレーブセルは通常空になる
      // master への参照機能は ExcelJS の isMerged/master に相当するものがない
      console.log('[SheetJS] ⚠ SheetJS には isMerged/master プロパティがない — !merges から計算が必要');
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 5: 罫線スタイル（X-2）
  // ────────────────────────────────────────────
  describe('検証5: 罫線スタイル（X-2）', () => {
    it('セルスタイル(s)プロパティの存在を確認（通常読み込み）', () => {
      const cell = getCell(sheet, 'A5');
      console.log('[SheetJS] A5 (通常読み込み):', JSON.stringify(cell));
      console.log('[SheetJS] A5.s:', JSON.stringify(cell?.s));
    });

    it('セルスタイル(s)プロパティの存在を確認（cellStyles:true）', () => {
      const cell = getCell(sheetStyled, 'A5');
      console.log('[SheetJS cellStyles] A5:', JSON.stringify(cell));
      console.log('[SheetJS cellStyles] A5.s:', JSON.stringify(cell?.s));

      if (cell?.s) {
        const style = cell.s as Record<string, unknown>;
        console.log('[SheetJS cellStyles] A5.s.border:', JSON.stringify(style.border));
        if (style.border) {
          const border = style.border as Record<string, unknown>;
          console.log('[SheetJS cellStyles] border.top:', JSON.stringify(border.top));
          console.log('[SheetJS cellStyles] border.bottom:', JSON.stringify(border.bottom));
        }
      }
    });

    it('実線罫線（thin）が取得できるか検証', () => {
      const cell = getCell(sheetStyled, 'A5');
      const style = cell?.s as Record<string, unknown> | undefined;
      const border = style?.border as Record<string, unknown> | undefined;

      if (border?.top) {
        const top = border.top as Record<string, unknown>;
        console.log('[SheetJS] thin border top:', JSON.stringify(top));
        expect(top.style).toBe('thin');
      } else {
        console.log('[SheetJS] ⚠ 罫線情報が取得できない — コミュニティ版の制限');
      }
    });

    it('二重線罫線（double）が取得できるか検証', () => {
      const cell = getCell(sheetStyled, 'A6');
      const style = cell?.s as Record<string, unknown> | undefined;
      const border = style?.border as Record<string, unknown> | undefined;

      if (border?.top) {
        const top = border.top as Record<string, unknown>;
        console.log('[SheetJS] double border top:', JSON.stringify(top));
      } else {
        console.log('[SheetJS] ⚠ 二重線罫線が取得できない');
      }
    });

    it('破線罫線（dashed）が取得できるか検証', () => {
      const cell = getCell(sheetStyled, 'A7');
      const style = cell?.s as Record<string, unknown> | undefined;
      const border = style?.border as Record<string, unknown> | undefined;

      if (border?.top) {
        const top = border.top as Record<string, unknown>;
        console.log('[SheetJS] dashed border top:', JSON.stringify(top));
      } else {
        console.log('[SheetJS] ⚠ 破線罫線が取得できない');
      }
    });

    it('4辺すべての罫線情報が取得できるか検証', () => {
      const cell = getCell(sheetStyled, 'A5');
      const style = cell?.s as Record<string, unknown> | undefined;
      const border = style?.border as Record<string, unknown> | undefined;

      if (border) {
        console.log('[SheetJS] A5 border 4辺:', JSON.stringify(border));
        expect(border.top).toBeDefined();
        expect(border.bottom).toBeDefined();
        expect(border.left).toBeDefined();
        expect(border.right).toBeDefined();
      } else {
        console.log('[SheetJS] ⚠ border オブジェクトが存在しない');
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 6: セル値（X-2）
  // ────────────────────────────────────────────
  describe('検証6: セル値（X-2）', () => {
    it('文字列が取得できる', () => {
      const cell = getCell(sheet, 'A1');
      console.log('[SheetJS] A1:', JSON.stringify(cell));
      expect(cell?.v).toBe('請求書');
      expect(cell?.t).toBe('s'); // string type
    });

    it('数値が取得できる', () => {
      const cell = getCell(sheet, 'B2');
      console.log('[SheetJS] B2:', JSON.stringify(cell));
      expect(cell?.v).toBe(12345);
      expect(cell?.t).toBe('n'); // number type
    });

    it('日付が取得できる', () => {
      const cell = getCell(sheet, 'C2');
      console.log('[SheetJS] C2:', JSON.stringify(cell));
      // SheetJS は日付をシリアル値（数値）として返す場合がある
      // cellDates:true オプションで Date に変換可能
      if (cell?.t === 'd' && cell.v instanceof Date) {
        expect(cell.v.getFullYear()).toBe(2026);
        expect(cell.v.getMonth()).toBe(2);
        expect(cell.v.getDate()).toBe(6);
      } else if (cell?.t === 'n') {
        console.log('[SheetJS] 日付はシリアル値で取得:', cell.v);
        // シリアル値から日付に変換
        const date = XLSX.SSF.parse_date_code(cell.v as number);
        console.log('[SheetJS] 変換後:', date);
        expect(date.y).toBe(2026);
        expect(date.m).toBe(3);
        expect(date.d).toBe(6);
      }
    });

    it('日付を cellDates:true で Date オブジェクトとして取得できるか', async () => {
      const buffer = await createTestWorkbook();
      const wbDates = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
      const ws = wbDates.Sheets[wbDates.SheetNames[0]];
      const cell = getCell(ws!, 'C2');
      console.log('[SheetJS cellDates] C2:', JSON.stringify(cell));

      if (cell?.t === 'd') {
        // SheetJS は cellDates:true で v を ISO 文字列として返す場合がある
        if (cell.v instanceof Date) {
          expect(cell.v.getFullYear()).toBe(2026);
        } else if (typeof cell.v === 'string') {
          console.log('[SheetJS] cellDates:true で ISO文字列として取得:', cell.v);
          const date = new Date(cell.v);
          expect(date.getFullYear()).toBe(2026);
          expect(date.getMonth()).toBe(2); // 3月
          expect(date.getDate()).toBe(6);
        }
      } else {
        console.log('[SheetJS] ⚠ cellDates:true でも type=d にならない');
      }
    });

    it('数式セルの計算結果が取得できる', () => {
      const cell = getCell(sheet, 'B3');
      console.log('[SheetJS] B3 (数式セル):', JSON.stringify(cell));

      // SheetJS は f プロパティに数式、v プロパティに結果を格納
      if (cell?.f) {
        console.log('[SheetJS] formula:', cell.f, 'result:', cell.v);
        expect(cell.f).toBe('B2*2');
        expect(cell.v).toBe(24690);
      } else if (cell?.v !== undefined) {
        // 数式がなく値のみの場合
        expect(cell.v).toBe(24690);
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 7: フォント情報
  // ────────────────────────────────────────────
  describe('検証7: フォント情報', () => {
    it('フォント名・サイズ・太字が取得できるか検証（cellStyles:true）', () => {
      const cell = getCell(sheetStyled, 'A1');
      const style = cell?.s as Record<string, unknown> | undefined;
      console.log('[SheetJS cellStyles] A1.s:', JSON.stringify(style));

      if (style?.font) {
        const font = style.font as Record<string, unknown>;
        console.log('[SheetJS] font:', JSON.stringify(font));
        if (font.name !== undefined) expect(font.name).toBe('MS Gothic');
        if (font.sz !== undefined) expect(font.sz).toBe(16);
        if (font.bold !== undefined) expect(font.bold).toBe(true);
      } else {
        console.log('[SheetJS] ⚠ フォント情報が取得できない — コミュニティ版の制限');
      }
    });

    it('フォント色が取得できるか検証', () => {
      const cell = getCell(sheetStyled, 'A1');
      const style = cell?.s as Record<string, unknown> | undefined;
      const font = style?.font as Record<string, unknown> | undefined;

      if (font?.color) {
        console.log('[SheetJS] font color:', JSON.stringify(font.color));
      } else {
        console.log('[SheetJS] ⚠ フォント色が取得できない');
      }
    });

    it('イタリック・色が取得できるか検証', () => {
      const cell = getCell(sheetStyled, 'B4');
      const style = cell?.s as Record<string, unknown> | undefined;
      const font = style?.font as Record<string, unknown> | undefined;
      console.log('[SheetJS cellStyles] B4 font:', JSON.stringify(font));

      if (font) {
        if (font.italic !== undefined) expect(font.italic).toBe(true);
        if (font.bold !== undefined) expect(font.bold).toBe(true);
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 8: 背景色・塗りつぶし
  // ────────────────────────────────────────────
  describe('検証8: 背景色・塗りつぶし', () => {
    it('パターン塗りつぶしが取得できるか検証（cellStyles:true）', () => {
      const cell = getCell(sheetStyled, 'C4');
      const style = cell?.s as Record<string, unknown> | undefined;
      console.log('[SheetJS cellStyles] C4.s:', JSON.stringify(style));

      if (style?.fill || style?.fgColor || style?.bgColor || style?.patternType) {
        console.log('[SheetJS] fill info found:', JSON.stringify({
          fill: style.fill,
          fgColor: style.fgColor,
          bgColor: style.bgColor,
          patternType: style.patternType,
        }));
      } else {
        console.log('[SheetJS] ⚠ 塗りつぶし情報が取得できない — コミュニティ版の制限');
      }
    });
  });

  // ────────────────────────────────────────────
  // 検証項目 9: 印刷範囲
  // ────────────────────────────────────────────
  describe('検証9: 印刷範囲', () => {
    it('印刷範囲が取得できるか検証', () => {
      // SheetJS は Defined Names 経由で印刷範囲を格納
      const wbObj = wb as Record<string, unknown>;
      console.log('[SheetJS] Workbook keys:', Object.keys(wb));

      if (wbObj.Workbook && typeof wbObj.Workbook === 'object') {
        const workbook = wbObj.Workbook as Record<string, unknown>;
        if (workbook.Names && Array.isArray(workbook.Names)) {
          const printArea = workbook.Names.find(
            (n: Record<string, unknown>) => n.Name === '_xlnm.Print_Area'
          );
          console.log('[SheetJS] Print_Area defined name:', JSON.stringify(printArea));
          if (printArea) {
            const ref = (printArea as Record<string, unknown>).Ref as string;
            expect(ref).toContain('A1');
            expect(ref).toContain('H20');
          }
        } else {
          console.log('[SheetJS] Workbook.Names:', JSON.stringify(workbook.Names));
        }
      }

      // !print プロパティも確認
      const printProp = (sheet as Record<string, unknown>)['!print'];
      console.log('[SheetJS] !print:', JSON.stringify(printProp));
    });
  });

  // ════════════════════════════════════════════
  // 深掘り検証A: 結合セルの罫線（cellStyles:true）
  // ════════════════════════════════════════════
  describe('深掘りA: 結合セルの罫線スタイル', () => {
    describe('パターン1: 罫線設定後に結合（B10:D10）', () => {
      it('master セル (B10) の罫線情報を確認', () => {
        const cell = getCell(sheetStyled, 'B10');
        const style = cell?.s as Record<string, unknown> | undefined;
        console.log('[SheetJS深掘りA-1] B10.s:', JSON.stringify(style));

        if (style?.border) {
          const border = style.border as Record<string, unknown>;
          console.log('[SheetJS深掘りA-1] B10 border:', JSON.stringify(border));
        } else {
          console.log('[SheetJS深掘りA-1] ⚠ B10 罫線が取得できない');
        }
      });

      it('内側セル (C10) の罫線情報を確認', () => {
        const cell = getCell(sheetStyled, 'C10');
        const style = cell?.s as Record<string, unknown> | undefined;
        console.log('[SheetJS深掘りA-1] C10.s:', JSON.stringify(style));
      });

      it('右端セル (D10) の罫線情報を確認', () => {
        const cell = getCell(sheetStyled, 'D10');
        const style = cell?.s as Record<string, unknown> | undefined;
        console.log('[SheetJS深掘りA-1] D10.s:', JSON.stringify(style));
      });
    });

    describe('パターン2: 結合後に master 罫線設定（B12:D13）', () => {
      it('master セル (B12) の罫線情報を確認', () => {
        const cell = getCell(sheetStyled, 'B12');
        const style = cell?.s as Record<string, unknown> | undefined;
        console.log('[SheetJS深掘りA-2] B12.s:', JSON.stringify(style));
      });

      it('slave セルの罫線伝播を確認', () => {
        for (const addr of ['C12', 'D12', 'B13', 'C13', 'D13']) {
          const cell = getCell(sheetStyled, addr);
          const style = cell?.s as Record<string, unknown> | undefined;
          console.log(`[SheetJS深掘りA-2] ${addr}.s:`, JSON.stringify(style));
        }
      });

      it('外周セルの外向き罫線を確認', () => {
        for (const addr of ['D12', 'B13', 'D13']) {
          const cell = getCell(sheetStyled, addr);
          const style = cell?.s as Record<string, unknown> | undefined;
          console.log(`[SheetJS深掘りA-2] ${addr} border:`, JSON.stringify((style as Record<string, unknown>)?.border));
        }
      });
    });

    describe('パターン3: 外周セルに個別罫線設定（B15:D16）', () => {
      it('上辺セルの top 罫線を確認', () => {
        for (const col of [1, 2, 3]) {
          const addr = encodeCellAddress(14, col); // row 15 = index 14
          const cell = getCell(sheetStyled, addr);
          const style = cell?.s as Record<string, unknown> | undefined;
          console.log(`[SheetJS深掘りA-3] ${addr} top:`, JSON.stringify((style?.border as Record<string, unknown>)?.top));
        }
      });

      it('下辺セルの bottom 罫線を確認', () => {
        for (const col of [1, 2, 3]) {
          const addr = encodeCellAddress(15, col); // row 16 = index 15
          const cell = getCell(sheetStyled, addr);
          const style = cell?.s as Record<string, unknown> | undefined;
          console.log(`[SheetJS深掘りA-3] ${addr} bottom:`, JSON.stringify((style?.border as Record<string, unknown>)?.bottom));
        }
      });

      it('左辺セルの left 罫線を確認', () => {
        for (const row of [14, 15]) {
          const addr = encodeCellAddress(row, 1); // col B = index 1
          const cell = getCell(sheetStyled, addr);
          const style = cell?.s as Record<string, unknown> | undefined;
          console.log(`[SheetJS深掘りA-3] ${addr} left:`, JSON.stringify((style?.border as Record<string, unknown>)?.left));
        }
      });

      it('右辺セルの right 罫線を確認', () => {
        for (const row of [14, 15]) {
          const addr = encodeCellAddress(row, 3); // col D = index 3
          const cell = getCell(sheetStyled, addr);
          const style = cell?.s as Record<string, unknown> | undefined;
          console.log(`[SheetJS深掘りA-3] ${addr} right:`, JSON.stringify((style?.border as Record<string, unknown>)?.right));
        }
      });

      it('内側セル (C15, C16) の罫線を確認', () => {
        for (const row of [14, 15]) {
          const addr = encodeCellAddress(row, 2); // col C = index 2
          const cell = getCell(sheetStyled, addr);
          const style = cell?.s as Record<string, unknown> | undefined;
          console.log(`[SheetJS深掘りA-3] ${addr} (内側):`, JSON.stringify(style?.border));
        }
      });
    });
  });

  // ════════════════════════════════════════════
  // 深掘り検証B: pageMargins 制約004 詳細
  // ════════════════════════════════════════════
  describe('深掘りB: pageMargins 制約004 詳細', () => {
    it('margins が未設定のシートではデフォルト値が返る', () => {
      const margins = sheet2['!margins'];
      console.log('[SheetJS 制約004] sheet2 (未設定) margins:', JSON.stringify(margins));

      if (margins) {
        console.log(
          `  top=${margins.top}, bottom=${margins.bottom},`,
          `left=${margins.left}, right=${margins.right},`,
          `header=${margins.header}, footer=${margins.footer}`,
        );
      }
    });

    it('mm 変換が制約004の計算式と一致する', () => {
      const margins = sheet['!margins'];
      if (!margins) throw new Error('margins が未定義');

      const topMm = margins.top * 25.4;
      const bottomMm = margins.bottom * 25.4;
      const leftMm = margins.left * 25.4;
      const rightMm = margins.right * 25.4;

      // A4 = 210 x 297 mm
      const printableWidth = 210 - (margins.left + margins.right) * 25.4;
      const printableHeight = 297 - (margins.top + margins.bottom) * 25.4;

      console.log(`[SheetJS 制約004] topMm=${topMm}, bottomMm=${bottomMm}, leftMm=${leftMm}, rightMm=${rightMm}`);
      console.log(`[SheetJS 制約004] printableArea: ${printableWidth.toFixed(1)} x ${printableHeight.toFixed(1)} mm`);

      expect(topMm).toBeCloseTo(0.8 * 25.4, 2);
      expect(printableWidth).toBeGreaterThan(0);
      expect(printableHeight).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════
  // 深掘り検証C: pageSetup scale / fitToPage 制約003 詳細
  // ════════════════════════════════════════════
  describe('深掘りC: pageSetup scale / fitToPage 制約003 詳細', () => {
    it('scale モードと fitToPage モードの判別に必要な情報を調査', () => {
      // sheet1: scale=80
      const ps1 = (sheet as Record<string, unknown>)['!pageSetup'];
      console.log('[SheetJS 制約003] sheet1 pageSetup:', JSON.stringify(ps1));

      // sheet2: fitToPage
      const ps2 = (sheet2 as Record<string, unknown>)['!pageSetup'];
      console.log('[SheetJS 制約003] sheet2 pageSetup:', JSON.stringify(ps2));

      // Workbook レベルのシートプロパティも確認
      const wbObj = wb as Record<string, unknown>;
      if (wbObj.Workbook && typeof wbObj.Workbook === 'object') {
        const workbook = wbObj.Workbook as Record<string, unknown>;
        if (workbook.Sheets && Array.isArray(workbook.Sheets)) {
          for (let i = 0; i < workbook.Sheets.length; i++) {
            console.log(`[SheetJS 制約003] Workbook.Sheets[${i}]:`, JSON.stringify(workbook.Sheets[i]));
          }
        }
        if (workbook.Views) {
          console.log('[SheetJS 制約003] Workbook.Views:', JSON.stringify(workbook.Views));
        }
      }
    });

    it('fitToPage の fitToWidth / fitToHeight が取得できるか検証', () => {
      const ps = (sheet2 as Record<string, unknown>)['!pageSetup'];
      if (ps && typeof ps === 'object') {
        const pageSetup = ps as Record<string, unknown>;
        console.log('[SheetJS 制約003] fitToWidth:', pageSetup.fitToWidth);
        console.log('[SheetJS 制約003] fitToHeight:', pageSetup.fitToHeight);
      } else {
        console.log('[SheetJS 制約003] ⚠ !pageSetup が存在しない');
      }
    });

    it('effectiveScale の計算に必要な値が揃うか検証', () => {
      const ps1 = (sheet as Record<string, unknown>)['!pageSetup'] as Record<string, unknown> | undefined;
      if (ps1?.scale !== undefined) {
        const effectiveScale = Number(ps1.scale) / 100;
        console.log('[SheetJS 制約003] scale mode effectiveScale:', effectiveScale);
        expect(effectiveScale).toBe(0.8);
      } else {
        console.log('[SheetJS 制約003] ⚠ scale が取得できないため effectiveScale 計算不可');
      }
    });
  });

  // ────────────────────────────────────────────
  // 追加検証: アライメント情報
  // ────────────────────────────────────────────
  describe('追加検証: アライメント', () => {
    it('水平・垂直アライメントが取得できるか検証（cellStyles:true）', () => {
      const cell = getCell(sheetStyled, 'A1');
      const style = cell?.s as Record<string, unknown> | undefined;
      console.log('[SheetJS cellStyles] A1 alignment:', JSON.stringify(style?.alignment));

      if (style?.alignment) {
        const alignment = style.alignment as Record<string, unknown>;
        if (alignment.horizontal !== undefined) expect(alignment.horizontal).toBe('center');
        if (alignment.vertical !== undefined) expect(alignment.vertical).toBe('center'); // SheetJS では 'middle' ではなく 'center' の可能性
      } else {
        console.log('[SheetJS] ⚠ アライメント情報が取得できない');
      }
    });
  });

  // ────────────────────────────────────────────
  // 追加検証: ワークシート列挙
  // ────────────────────────────────────────────
  describe('追加検証: ワークシート列挙', () => {
    it('全シートを列挙できる', () => {
      const sheetNames = wb.SheetNames;
      console.log('[SheetJS] SheetNames:', sheetNames);
      expect(sheetNames).toContain('帳票サンプル');
      expect(sheetNames).toContain('fitToPage');
      expect(sheetNames.length).toBe(2);
    });
  });

  // ────────────────────────────────────────────
  // 追加検証: 行・セルのイテレーション
  // ────────────────────────────────────────────
  describe('追加検証: 行・セルのイテレーション', () => {
    it('sheet_to_json でデータ行を取得できる', () => {
      // SheetJS のイテレーション方法: sheet_to_json
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log('[SheetJS] row count (sheet_to_json):', rows.length);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('!ref からセル範囲を取得し走査できる', () => {
      const ref = sheet['!ref'];
      console.log('[SheetJS] !ref:', ref);
      expect(ref).toBeDefined();

      if (ref) {
        const range = XLSX.utils.decode_range(ref);
        console.log('[SheetJS] range:', JSON.stringify(range));
        // 全セルを走査
        let cellCount = 0;
        for (let r = range.s.r; r <= range.e.r; r++) {
          for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = sheet[addr];
            if (cell) cellCount++;
          }
        }
        console.log('[SheetJS] 非空セル数:', cellCount);
        expect(cellCount).toBeGreaterThan(0);
      }
    });
  });
});
