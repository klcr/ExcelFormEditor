/**
 * テスト用フィクスチャ: Excel 方眼紙ベースの見積書ワークブックを生成する。
 *
 * 印刷範囲・結合セル・罫線・数式・共有数式・エラー数式など
 * formatCellValue の全分岐を網羅するデータを含む。
 */
import ExcelJS from 'exceljs';

const THIN_BORDER: ExcelJS.Border = {
  style: 'thin',
  color: { argb: 'FF000000' },
};

const ALL_THIN: Partial<ExcelJS.Borders> = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
};

/** 指定範囲の全セルに罫線を設定する */
function applyBordersToRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  borders: Partial<ExcelJS.Borders> = ALL_THIN,
): void {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      sheet.getCell(r, c).border = borders;
    }
  }
}

/** テスト用見積書ワークブックをバッファとして生成する */
export async function createEstimateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // ── シート1: 見積書（方眼紙ベース） ──
  const ws = workbook.addWorksheet('見積書');

  // 用紙設定
  ws.pageSetup.paperSize = 9; // A4
  ws.pageSetup.orientation = 'portrait';
  ws.pageSetup.scale = 100;
  ws.pageSetup.margins = {
    top: 0.79,
    bottom: 0.59,
    left: 0.59,
    right: 0.59,
    header: 0.31,
    footer: 0.31,
  };

  // 印刷範囲: A1:J25（方眼紙 10列×25行）
  ws.pageSetup.printArea = 'A1:J25';

  // 方眼紙: 全列を均等幅に設定（約 5.5 文字 ≈ 20mm）
  for (let c = 1; c <= 10; c++) {
    ws.getColumn(c).width = 5.5;
  }

  // 行高を均等に（約 15pt）
  for (let r = 1; r <= 25; r++) {
    ws.getRow(r).height = 15;
  }

  // ── タイトル行（結合セル） ──
  ws.mergeCells('A1:J2');
  const titleCell = ws.getCell('A1');
  titleCell.value = '御　見　積　書';
  titleCell.font = {
    name: 'MS Gothic',
    size: 18,
    bold: true,
    color: { argb: 'FF000000' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = {
    bottom: { style: 'double', color: { argb: 'FF000000' } },
  };

  // ── 宛先・日付ヘッダー ──
  ws.mergeCells('A4:D4');
  ws.getCell('A4').value = '株式会社サンプル 御中';
  ws.getCell('A4').font = { size: 11, bold: true };

  ws.mergeCells('G4:J4');
  ws.getCell('G4').value = new Date(2026, 2, 6); // 日付型
  ws.getCell('G4').numFmt = 'yyyy/mm/dd';
  ws.getCell('G4').alignment = { horizontal: 'right' };

  // ── 見積番号（文字列） ──
  ws.mergeCells('G5:J5');
  ws.getCell('G5').value = '見積番号: EST-2026-0042';
  ws.getCell('G5').alignment = { horizontal: 'right' };

  // ── 合計金額行（結合 + 数式） ──
  ws.mergeCells('A7:D7');
  ws.getCell('A7').value = '合計金額（税込）';
  ws.getCell('A7').font = { size: 12, bold: true };
  ws.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
  applyBordersToRange(ws, 7, 7, 1, 4);

  ws.mergeCells('E7:J7');
  ws.getCell('E7').value = { formula: 'E23+E24', result: 115500 };
  ws.getCell('E7').numFmt = '¥#,##0';
  ws.getCell('E7').font = { size: 14, bold: true, color: { argb: 'FFFF0000' } };
  ws.getCell('E7').alignment = { horizontal: 'right', vertical: 'middle' };
  applyBordersToRange(ws, 7, 7, 5, 10, {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'double', color: { argb: 'FF000000' } },
    left: { style: 'medium', color: { argb: 'FF000000' } },
    right: { style: 'medium', color: { argb: 'FF000000' } },
  });

  // ── 明細テーブルヘッダー（行9） ──
  const headers = ['No.', '', '品名', '', '', '', '数量', '単位', '単価', '金額'];
  for (let c = 1; c <= 10; c++) {
    const cell = ws.getCell(9, c);
    cell.value = headers[c - 1] || '';
    cell.font = { size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
  }
  ws.mergeCells('A9:B9'); // No.
  ws.mergeCells('C9:F9'); // 品名
  applyBordersToRange(ws, 9, 9, 1, 10);

  // ── 明細データ（行10〜21） ──
  const items = [
    { no: 1, name: 'システム設計費', qty: 1, unit: '式', price: 50000 },
    { no: 2, name: 'フロントエンド開発', qty: 3, unit: '人月', price: 10000 },
    { no: 3, name: 'バックエンド開発', qty: 2, unit: '人月', price: 12000 },
    { no: 4, name: 'テスト・検証', qty: 1, unit: '式', price: 8000 },
    { no: 5, name: 'ドキュメント作成', qty: 1, unit: '式', price: 5000 },
  ];

  for (const [i, item] of items.entries()) {
    const row = 10 + i;

    ws.mergeCells(`A${row}:B${row}`);
    ws.getCell(row, 1).value = item.no;
    ws.getCell(row, 1).alignment = { horizontal: 'center' };

    ws.mergeCells(`C${row}:F${row}`);
    ws.getCell(row, 3).value = item.name;

    ws.getCell(row, 7).value = item.qty;
    ws.getCell(row, 7).alignment = { horizontal: 'right' };

    ws.getCell(row, 8).value = item.unit;
    ws.getCell(row, 8).alignment = { horizontal: 'center' };

    ws.getCell(row, 9).value = item.price;
    ws.getCell(row, 9).numFmt = '#,##0';
    ws.getCell(row, 9).alignment = { horizontal: 'right' };

    // 金額 = 数量 × 単価（数式）
    ws.getCell(row, 10).value = {
      formula: `G${row}*I${row}`,
      result: item.qty * item.price,
    };
    ws.getCell(row, 10).numFmt = '#,##0';
    ws.getCell(row, 10).alignment = { horizontal: 'right' };

    applyBordersToRange(ws, row, row, 1, 10);
  }

  // 空行（行15〜21）に罫線のみ設定
  for (let row = 15; row <= 21; row++) {
    ws.mergeCells(`A${row}:B${row}`);
    ws.mergeCells(`C${row}:F${row}`);
    applyBordersToRange(ws, row, row, 1, 10);
  }

  // ── 小計行（行22） ──
  ws.mergeCells('A22:I22');
  ws.getCell('A22').value = '小計';
  ws.getCell('A22').alignment = { horizontal: 'right' };
  ws.getCell('A22').font = { bold: true };
  ws.getCell(22, 10).value = {
    formula: 'SUM(J10:J21)',
    result: 105000,
  };
  ws.getCell(22, 10).numFmt = '¥#,##0';
  ws.getCell(22, 10).alignment = { horizontal: 'right' };
  applyBordersToRange(ws, 22, 22, 1, 10);

  // ── 消費税行（行23）── 通常の数式 ──
  ws.mergeCells('A23:I23');
  ws.getCell('A23').value = '消費税（10%）';
  ws.getCell('A23').alignment = { horizontal: 'right' };
  ws.getCell(23, 10).value = { formula: 'J22*0.1', result: 10500 };
  ws.getCell(23, 10).numFmt = '¥#,##0';
  ws.getCell(23, 10).alignment = { horizontal: 'right' };
  applyBordersToRange(ws, 23, 23, 1, 10);

  // ── 合計行（行24）── 通常の数式 ──
  ws.mergeCells('A24:I24');
  ws.getCell('A24').value = '合計';
  ws.getCell('A24').alignment = { horizontal: 'right' };
  ws.getCell('A24').font = { bold: true, size: 11 };
  ws.getCell(24, 10).value = { formula: 'J22+J23', result: 115500 };
  ws.getCell(24, 10).numFmt = '¥#,##0';
  ws.getCell(24, 10).font = { bold: true, size: 11 };
  ws.getCell(24, 10).alignment = { horizontal: 'right' };
  applyBordersToRange(ws, 24, 24, 1, 10, {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'double', color: { argb: 'FF000000' } },
    left: THIN_BORDER,
    right: THIN_BORDER,
  });

  // ── 備考行（行25）— リッチテキスト ──
  ws.mergeCells('A25:J25');
  ws.getCell('A25').value = {
    richText: [
      { text: '備考: ', font: { bold: true } },
      { text: '納期は受注後30営業日以内。お支払いは月末締め翌月末払い。' },
    ],
  };

  // ── シート2: エラー数式テスト ──
  const ws2 = workbook.addWorksheet('エラー数式');
  ws2.pageSetup.printArea = 'A1:D6';

  ws2.getCell('A1').value = '正常数式';
  ws2.getCell('B1').value = { formula: '1+1', result: 2 };

  ws2.getCell('A2').value = '#REF! エラー';
  ws2.getCell('B2').value = {
    formula: 'Sheet999!A1',
    result: { error: '#REF!' },
  };

  ws2.getCell('A3').value = '#DIV/0! エラー';
  ws2.getCell('B3').value = {
    formula: '1/0',
    result: { error: '#DIV/0!' },
  };

  ws2.getCell('A4').value = '#NAME? エラー';
  ws2.getCell('B4').value = {
    formula: 'UNKNOWNFUNC()',
    result: { error: '#NAME?' },
  };

  // sharedFormula: B1 が formula master、B5 が clone（master は上にいる）
  ws2.getCell('A5').value = 'sharedFormula クローン';
  ws2.getCell('B5').value = {
    sharedFormula: 'B1',
    result: 2,
  };

  // sharedFormula with error: B2 が formula master、B6 が clone
  ws2.getCell('A6').value = 'sharedFormula エラー';
  ws2.getCell('B6').value = {
    sharedFormula: 'B2',
    result: { error: '#REF!' },
  };

  // ハイパーリンク
  ws2.getCell('D1').value = {
    text: 'リンクテスト',
    hyperlink: 'https://example.com',
  };

  // boolean
  ws2.getCell('D2').value = true;
  ws2.getCell('D3').value = false;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
