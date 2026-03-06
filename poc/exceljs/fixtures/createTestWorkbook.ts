/**
 * ExcelJS PoC: テスト用ワークブックを生成する。
 * ExcelJS で書き出し → 読み戻しで検証するため、手動で .xlsx を用意する代わりに使う。
 */
import ExcelJS from 'exceljs';

/** テスト用ワークブックをバッファとして生成する */
export async function createTestWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('帳票サンプル');

  // ── pageMargins（制約004: インチ単位） ──
  sheet.pageSetup.margins = {
    top: 0.8,
    bottom: 0.6,
    left: 0.5,
    right: 0.5,
    header: 0.3,
    footer: 0.25,
  };

  // ── pageSetup（制約003: scale / orientation / paperSize） ──
  sheet.pageSetup.paperSize = 9; // A4
  sheet.pageSetup.orientation = 'portrait';
  sheet.pageSetup.scale = 80;

  // ── 印刷範囲 ──
  sheet.pageSetup.printArea = 'A1:H20';

  // ── 列幅（文字数単位、制約001） ──
  sheet.getColumn(1).width = 8.43; // デフォルト幅
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 10;

  // ── 行高（pt 単位、制約001） ──
  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 15;
  sheet.getRow(3).height = 25;
  sheet.getRow(4).height = 18;

  // ── セル結合（X-2） ──
  sheet.mergeCells('A1:C1'); // 横方向結合
  sheet.mergeCells('D2:D4'); // 縦方向結合
  sheet.mergeCells('E5:G7'); // ブロック結合

  // ── セル値（X-2: テキスト・数値・日付・数式） ──
  const cellA1 = sheet.getCell('A1');
  cellA1.value = '請求書';
  cellA1.font = { name: 'MS Gothic', size: 16, bold: true, color: { argb: 'FF000000' } };
  cellA1.alignment = { horizontal: 'center', vertical: 'middle' };

  const cellB2 = sheet.getCell('B2');
  cellB2.value = 12345;

  const cellC2 = sheet.getCell('C2');
  cellC2.value = new Date(2026, 2, 6); // 2026-03-06

  const cellA3 = sheet.getCell('A3');
  cellA3.value = '通常テキスト';

  // 数式セル（計算結果のみ取得できるか検証）
  const cellB3 = sheet.getCell('B3');
  cellB3.value = { formula: 'B2*2', result: 24690 };

  // ── 罫線スタイル（X-2） ──
  const cellA5 = sheet.getCell('A5');
  cellA5.value = '実線罫線';
  cellA5.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const cellA6 = sheet.getCell('A6');
  cellA6.value = '二重線罫線';
  cellA6.border = {
    top: { style: 'double', color: { argb: 'FF0000FF' } },
    bottom: { style: 'double', color: { argb: 'FF0000FF' } },
    left: { style: 'double', color: { argb: 'FF0000FF' } },
    right: { style: 'double', color: { argb: 'FF0000FF' } },
  };

  const cellA7 = sheet.getCell('A7');
  cellA7.value = '破線罫線';
  cellA7.border = {
    top: { style: 'dashed', color: { argb: 'FFFF0000' } },
    bottom: { style: 'dashed', color: { argb: 'FFFF0000' } },
    left: { style: 'dashed', color: { argb: 'FFFF0000' } },
    right: { style: 'dashed', color: { argb: 'FFFF0000' } },
  };

  // ── フォント情報 ──
  const cellB4 = sheet.getCell('B4');
  cellB4.value = '太字赤文字';
  cellB4.font = { bold: true, size: 12, color: { argb: 'FFFF0000' }, italic: true };

  // ── 背景色・塗りつぶし ──
  const cellC4 = sheet.getCell('C4');
  cellC4.value = '背景色あり';
  cellC4.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF00' }, // 黄色
  };

  // ── 結合セル罫線パターン（検証項目: 結合境界の内側罫線） ──

  // パターン1: 結合前に全セルに罫線を設定 → 結合 → 内側罫線はどうなるか
  // B10:D10 を結合（横3セル）
  for (const col of [2, 3, 4]) {
    const cell = sheet.getCell(10, col);
    cell.value = col === 2 ? '結合罫線テスト1' : undefined;
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
  }
  sheet.mergeCells('B10:D10');

  // パターン2: 先に結合してから master に外枠罫線を設定
  // B12:D13 を結合（2x3 ブロック）
  sheet.mergeCells('B12:D13');
  const masterB12 = sheet.getCell('B12');
  masterB12.value = '結合罫線テスト2';
  masterB12.border = {
    top: { style: 'medium', color: { argb: 'FF0000FF' } },
    bottom: { style: 'medium', color: { argb: 'FF0000FF' } },
    left: { style: 'medium', color: { argb: 'FF0000FF' } },
    right: { style: 'medium', color: { argb: 'FF0000FF' } },
  };

  // パターン3: 結合範囲の外周セルに個別に罫線を設定（Excel実際の動作に近い）
  // B15:D16 を結合
  sheet.mergeCells('B15:D16');
  // 上辺: B15, C15, D15 の top
  for (const col of [2, 3, 4]) {
    sheet.getCell(15, col).border = {
      ...sheet.getCell(15, col).border,
      top: { style: 'thick', color: { argb: 'FFFF0000' } },
    };
  }
  // 下辺: B16, C16, D16 の bottom
  for (const col of [2, 3, 4]) {
    sheet.getCell(16, col).border = {
      ...sheet.getCell(16, col).border,
      bottom: { style: 'thick', color: { argb: 'FFFF0000' } },
    };
  }
  // 左辺: B15, B16 の left
  for (const row of [15, 16]) {
    sheet.getCell(row, 2).border = {
      ...sheet.getCell(row, 2).border,
      left: { style: 'thick', color: { argb: 'FFFF0000' } },
    };
  }
  // 右辺: D15, D16 の right
  for (const row of [15, 16]) {
    sheet.getCell(row, 4).border = {
      ...sheet.getCell(row, 4).border,
      right: { style: 'thick', color: { argb: 'FFFF0000' } },
    };
  }

  // ── fitToPage 設定のシート（2枚目） ──
  const sheet2 = workbook.addWorksheet('fitToPage');
  sheet2.pageSetup.fitToPage = true;
  sheet2.pageSetup.fitToWidth = 1;
  sheet2.pageSetup.fitToHeight = 0; // 高さは制約なし
  sheet2.pageSetup.paperSize = 9;
  sheet2.pageSetup.orientation = 'landscape';
  sheet2.getCell('A1').value = 'fitToPage テスト';

  // バッファとして書き出し
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
