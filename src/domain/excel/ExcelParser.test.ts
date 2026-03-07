import { describe, expect, it } from 'vitest';
import { collectMergeBorder } from './BorderConverter';
import {
  applyPrintArea,
  buildColumnPositions,
  buildMergeMap,
  buildRowPositions,
  columnNumberToLetter,
  letterToColumnNumber,
  parseCellRange,
  parsePrintArea,
  parseSheet,
  resolveOrientation,
  resolvePaperSize,
  resolveScaling,
} from './ExcelParser';
import type { RawCell, RawSheetData } from './ExcelTypes';

// --- ユーティリティ関数のテスト ---

describe('resolvePaperSize', () => {
  it('9 → A4', () => expect(resolvePaperSize(9)).toBe('A4'));
  it('8 → A3', () => expect(resolvePaperSize(8)).toBe('A3'));
  it('11 → A5', () => expect(resolvePaperSize(11)).toBe('A5'));
  it('未知の番号 → A4', () => expect(resolvePaperSize(1)).toBe('A4'));
  it('undefined → A4', () => expect(resolvePaperSize(undefined)).toBe('A4'));
});

describe('resolveOrientation', () => {
  it('landscape → landscape', () => expect(resolveOrientation('landscape')).toBe('landscape'));
  it('portrait → portrait', () => expect(resolveOrientation('portrait')).toBe('portrait'));
  it('undefined → portrait', () => expect(resolveOrientation(undefined)).toBe('portrait'));
  it('不正な値 → portrait', () => expect(resolveOrientation('invalid')).toBe('portrait'));
});

describe('resolveScaling', () => {
  it('scale モード（デフォルト）', () => {
    const result = resolveScaling({ scale: 80 });
    expect(result).toEqual({ mode: 'scale', percent: 80 });
  });

  it('fitToPage モード', () => {
    const result = resolveScaling({
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
    });
    expect(result).toEqual({ mode: 'fitToPage', width: 1, height: 1 });
  });

  it('fitToPage が true で width/height 未指定 → デフォルト 1', () => {
    const result = resolveScaling({ fitToPage: true });
    expect(result).toEqual({ mode: 'fitToPage', width: 1, height: 1 });
  });

  it('scale 未指定 → 100%', () => {
    const result = resolveScaling({});
    expect(result).toEqual({ mode: 'scale', percent: 100 });
  });
});

describe('letterToColumnNumber', () => {
  it('A → 1', () => expect(letterToColumnNumber('A')).toBe(1));
  it('Z → 26', () => expect(letterToColumnNumber('Z')).toBe(26));
  it('AA → 27', () => expect(letterToColumnNumber('AA')).toBe(27));
  it('AZ → 52', () => expect(letterToColumnNumber('AZ')).toBe(52));
  it('BA → 53', () => expect(letterToColumnNumber('BA')).toBe(53));
});

describe('columnNumberToLetter', () => {
  it('1 → A', () => expect(columnNumberToLetter(1)).toBe('A'));
  it('26 → Z', () => expect(columnNumberToLetter(26)).toBe('Z'));
  it('27 → AA', () => expect(columnNumberToLetter(27)).toBe('AA'));
  it('52 → AZ', () => expect(columnNumberToLetter(52)).toBe('AZ'));
  it('53 → BA', () => expect(columnNumberToLetter(53)).toBe('BA'));
});

describe('parseCellRange', () => {
  it('A1:C2 を正しくパースする', () => {
    expect(parseCellRange('A1:C2')).toEqual({
      startCol: 1,
      startRow: 1,
      endCol: 3,
      endRow: 2,
    });
  });

  it('AA10:AB20 を正しくパースする', () => {
    expect(parseCellRange('AA10:AB20')).toEqual({
      startCol: 27,
      startRow: 10,
      endCol: 28,
      endRow: 20,
    });
  });

  it('不正な範囲は null を返す', () => {
    expect(parseCellRange('invalid')).toBeNull();
    expect(parseCellRange('')).toBeNull();
  });
});

describe('buildColumnPositions', () => {
  it('空配列 → [0]', () => {
    expect(buildColumnPositions([])).toEqual([0]);
  });

  it('列幅から累積座標を計算する', () => {
    const positions = buildColumnPositions([8.43, 8.43]);
    expect(positions).toHaveLength(3);
    expect(positions[0]).toBe(0);
    // 8.43 文字 → (8.43 × 7 + 5) × 25.4 / 96 = 16.96... mm
    expect(positions[1]).toBeGreaterThan(0);
    expect(positions[2]).toBeCloseTo((positions[1] ?? 0) * 2, 5);
  });

  it('幅 0 以下はデフォルト列幅を使用する', () => {
    const withZero = buildColumnPositions([0]);
    const withDefault = buildColumnPositions([8.43]);
    expect(withZero[1]).toBeCloseTo(withDefault[1] ?? 0, 5);
  });
});

describe('buildRowPositions', () => {
  it('空配列 → [0]', () => {
    expect(buildRowPositions([])).toEqual([0]);
  });

  it('行高から累積座標を計算する', () => {
    const positions = buildRowPositions([15, 20]);
    expect(positions).toHaveLength(3);
    expect(positions[0]).toBe(0);
    // 15pt × 0.3528 = 5.292mm
    expect(positions[1]).toBeCloseTo(5.292, 3);
    // 15pt + 20pt → 5.292 + 7.056 = 12.348mm
    expect(positions[2]).toBeCloseTo(12.348, 3);
  });

  it('高さ 0 以下はデフォルト行高を使用する', () => {
    const withZero = buildRowPositions([0]);
    const withDefault = buildRowPositions([15]);
    expect(withZero[1]).toBeCloseTo(withDefault[1] ?? 0, 5);
  });
});

describe('buildMergeMap', () => {
  it('空配列 → 空マップ', () => {
    expect(buildMergeMap([]).size).toBe(0);
  });

  it('結合範囲をマスターアドレスでマップする', () => {
    const map = buildMergeMap(['A1:C2', 'D5:D8']);
    expect(map.size).toBe(2);
    expect(map.get('A1')).toEqual({
      startCol: 1,
      startRow: 1,
      endCol: 3,
      endRow: 2,
    });
    expect(map.get('D5')).toEqual({
      startCol: 4,
      startRow: 5,
      endCol: 4,
      endRow: 8,
    });
  });
});

// --- collectMergeBorder テスト ---

describe('collectMergeBorder', () => {
  function makeCellMap(cells: RawCell[]): ReadonlyMap<string, RawCell> {
    const map = new Map<string, RawCell>();
    for (const cell of cells) {
      map.set(cell.address, cell);
    }
    return map;
  }

  const merge = { startCol: 1, startRow: 1, endCol: 3, endRow: 2 }; // A1:C2

  it('外周セルから各辺の罫線を収集する', () => {
    const cellMap = makeCellMap([
      // top: A1 に top 罫線
      {
        address: 'A1',
        row: 1,
        col: 1,
        value: '',
        style: { border: { top: { style: 'thin', color: '000000' } } },
        isMerged: true,
      },
      // bottom: A2 に bottom 罫線
      {
        address: 'A2',
        row: 2,
        col: 1,
        value: '',
        style: { border: { bottom: { style: 'medium', color: 'FF0000' } } },
        isMerged: true,
      },
      // right: C1 に right 罫線
      {
        address: 'C1',
        row: 1,
        col: 3,
        value: '',
        style: { border: { right: { style: 'thick', color: '0000FF' } } },
        isMerged: true,
      },
    ]);

    const result = collectMergeBorder(merge, cellMap);
    expect(result).toBeDefined();
    expect(result?.top).toEqual({ style: 'thin', color: '000000' });
    expect(result?.bottom).toEqual({ style: 'medium', color: 'FF0000' });
    expect(result?.left).toBeUndefined(); // A1 に left 罫線なし
    expect(result?.right).toEqual({ style: 'thick', color: '0000FF' });
  });

  it('罫線が右端列の2行目にある場合でも収集する', () => {
    const cellMap = makeCellMap([
      // right: C2（最右列の2行目）に right 罫線
      {
        address: 'C2',
        row: 2,
        col: 3,
        value: '',
        style: { border: { right: { style: 'double', color: '00FF00' } } },
        isMerged: true,
      },
    ]);

    const result = collectMergeBorder(merge, cellMap);
    expect(result?.right).toEqual({ style: 'double', color: '00FF00' });
  });

  it('全セルに罫線がない場合は undefined を返す', () => {
    const cellMap = makeCellMap([
      { address: 'A1', row: 1, col: 1, value: '', style: {}, isMerged: true },
    ]);

    expect(collectMergeBorder(merge, cellMap)).toBeUndefined();
  });

  it('cellMap にセルが存在しない場合も安全に動作する', () => {
    const cellMap = makeCellMap([]);
    expect(collectMergeBorder(merge, cellMap)).toBeUndefined();
  });
});

// --- parseSheet 統合テスト ---

function createMinimalSheet(overrides?: Partial<RawSheetData>): RawSheetData {
  return {
    name: 'テスト',
    pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100 },
    margins: { top: 1.0, bottom: 1.0, left: 0.75, right: 0.75, header: 0.3, footer: 0.3 },
    columnWidths: [8.43, 8.43, 8.43],
    rowHeights: [15, 15, 15],
    cells: [],
    merges: [],
    rowBreaks: [],
    ...overrides,
  };
}

function createCell(overrides?: Partial<RawCell>): RawCell {
  return {
    address: 'A1',
    row: 1,
    col: 1,
    value: '',
    style: {},
    isMerged: false,
    ...overrides,
  };
}

describe('parseSheet', () => {
  it('空のシートでは PaperDefinition のみ返す', () => {
    const result = parseSheet(createMinimalSheet());

    expect(result.paper.size).toBe('A4');
    expect(result.paper.orientation).toBe('portrait');
    expect(result.boxes).toHaveLength(0);
    expect(result.lines).toHaveLength(0);
  });

  it('用紙の余白が正しく反映される', () => {
    const result = parseSheet(createMinimalSheet());

    expect(result.paper.margins.top).toBe(1.0);
    expect(result.paper.margins.left).toBe(0.75);
    expect(result.paper.printableArea.width).toBeGreaterThan(0);
    expect(result.paper.printableArea.height).toBeGreaterThan(0);
  });

  it('landscape シートを正しく処理する', () => {
    const result = parseSheet(
      createMinimalSheet({
        pageSetup: { paperSize: 9, orientation: 'landscape', scale: 100 },
      }),
    );

    expect(result.paper.orientation).toBe('landscape');
    // landscape A4: width=297, height=210
    expect(result.paper.printableArea.width).toBeGreaterThan(result.paper.printableArea.height);
  });

  it('単一セルを 1 つの Box に変換する', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [createCell({ address: 'A1', row: 1, col: 1, value: 'テスト' })],
      }),
    );

    expect(result.boxes).toHaveLength(1);
    expect(result.boxes[0]?.content).toBe('テスト');
    expect(result.boxes[0]?.rect.position.x).toBe(0);
    expect(result.boxes[0]?.rect.position.y).toBe(0);
    expect(result.boxes[0]?.rect.size.width).toBeGreaterThan(0);
    expect(result.boxes[0]?.rect.size.height).toBeGreaterThan(0);
  });

  it('複数セルをそれぞれ Box に変換する', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [
          createCell({ address: 'A1', row: 1, col: 1, value: 'セル1' }),
          createCell({ address: 'B1', row: 1, col: 2, value: 'セル2' }),
          createCell({ address: 'A2', row: 2, col: 1, value: 'セル3' }),
        ],
      }),
    );

    expect(result.boxes).toHaveLength(3);
    const [box0, box1, box2] = result.boxes;
    // B1 は A1 より右
    expect(box1?.rect.position.x).toBeGreaterThan(box0?.rect.position.x ?? 0);
    // A2 は A1 より下
    expect(box2?.rect.position.y).toBeGreaterThan(box0?.rect.position.y ?? 0);
  });

  it('結合セルの master のみ Box を生成する', () => {
    const result = parseSheet(
      createMinimalSheet({
        merges: ['A1:B2'],
        cells: [
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '結合',
            isMerged: true,
            mergeRange: 'A1:B2',
          }),
          createCell({ address: 'B1', row: 1, col: 2, value: '', isMerged: true }),
          createCell({ address: 'A2', row: 2, col: 1, value: '', isMerged: true }),
          createCell({ address: 'B2', row: 2, col: 2, value: '', isMerged: true }),
        ],
      }),
    );

    expect(result.boxes).toHaveLength(1);
    const mergedBox = result.boxes[0];
    expect(mergedBox?.content).toBe('結合');
    // 結合セルは 2 列 × 2 行分のサイズ
    const singleColWidth = mergedBox?.rect.size.width ?? 0;
    const singleRowHeight = mergedBox?.rect.size.height ?? 0;
    // 単一セルの 2 倍程度のサイズになることを確認
    const singleResult = parseSheet(
      createMinimalSheet({
        cells: [createCell({ address: 'A1', row: 1, col: 1, value: 'single' })],
      }),
    );
    const singleBox = singleResult.boxes[0];
    expect(singleColWidth).toBeCloseTo((singleBox?.rect.size.width ?? 0) * 2, 1);
    expect(singleRowHeight).toBeCloseTo((singleBox?.rect.size.height ?? 0) * 2, 1);
  });

  it('罫線付きセルから lines を生成する', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '',
            style: {
              border: {
                top: { style: 'thin', color: '000000' },
                bottom: { style: 'thin', color: '000000' },
                left: { style: 'thin', color: '000000' },
                right: { style: 'thin', color: '000000' },
              },
            },
          }),
        ],
      }),
    );

    expect(result.lines.length).toBe(4);
  });

  it('罫線なしセルでは lines が空', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [createCell({ address: 'A1', row: 1, col: 1, value: 'no border' })],
      }),
    );

    expect(result.lines).toHaveLength(0);
  });

  it('罫線スタイルを Box の border に反映する', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '',
            style: {
              border: {
                top: { style: 'thin', color: '000000' },
                bottom: { style: 'medium', color: 'FF0000' },
              },
            },
          }),
        ],
      }),
    );

    expect(result.boxes[0]?.border.top).toEqual({ style: 'thin', color: '000000' });
    expect(result.boxes[0]?.border.bottom).toEqual({ style: 'medium', color: 'FF0000' });
    expect(result.boxes[0]?.border.left).toBeUndefined();
    expect(result.boxes[0]?.border.right).toBeUndefined();
  });

  it('結合セルの罫線を外周セルから収集する', () => {
    const result = parseSheet(
      createMinimalSheet({
        merges: ['A1:B2'],
        cells: [
          // master: top + left 罫線あり
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '結合',
            isMerged: true,
            mergeRange: 'A1:B2',
            style: {
              border: {
                top: { style: 'thin', color: '000000' },
                left: { style: 'thin', color: '000000' },
              },
            },
          }),
          // 右上: right 罫線あり
          createCell({
            address: 'B1',
            row: 1,
            col: 2,
            value: '',
            isMerged: true,
            style: {
              border: { right: { style: 'medium', color: 'FF0000' } },
            },
          }),
          // 左下: bottom 罫線あり
          createCell({
            address: 'A2',
            row: 2,
            col: 1,
            value: '',
            isMerged: true,
            style: {
              border: { bottom: { style: 'thick', color: '0000FF' } },
            },
          }),
          createCell({ address: 'B2', row: 2, col: 2, value: '', isMerged: true }),
        ],
      }),
    );

    expect(result.boxes).toHaveLength(1);
    expect(result.boxes[0]?.border.top).toEqual({ style: 'thin', color: '000000' });
    expect(result.boxes[0]?.border.left).toEqual({ style: 'thin', color: '000000' });
    expect(result.boxes[0]?.border.right).toEqual({ style: 'medium', color: 'FF0000' });
    expect(result.boxes[0]?.border.bottom).toEqual({ style: 'thick', color: '0000FF' });
  });

  it('フォント情報を Box に反映する', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '',
            style: {
              font: { name: 'MS Gothic', size: 14, bold: true, italic: false, color: '333333' },
            },
          }),
        ],
      }),
    );

    expect(result.boxes[0]?.font.name).toBe('MS Gothic');
    expect(result.boxes[0]?.font.sizePt).toBe(14); // scale=100% なのでそのまま
    expect(result.boxes[0]?.font.bold).toBe(true);
    expect(result.boxes[0]?.font.color).toBe('333333');
  });

  it('塗りつぶし情報を Box に反映する', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '',
            style: { fill: { color: 'FFFF00' } },
          }),
        ],
      }),
    );

    expect(result.boxes[0]?.fill?.color).toBe('FFFF00');
  });

  it('配置情報を Box に反映する', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '',
            style: { alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } },
          }),
        ],
      }),
    );

    expect(result.boxes[0]?.alignment.horizontal).toBe('center');
    expect(result.boxes[0]?.alignment.vertical).toBe('middle');
    expect(result.boxes[0]?.alignment.wrapText).toBe(true);
  });

  it('scale 80% でボックスの座標が縮小される', () => {
    const sheet100 = createMinimalSheet({
      pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100 },
      cells: [createCell({ address: 'B2', row: 2, col: 2, value: 'test' })],
    });
    const sheet80 = createMinimalSheet({
      pageSetup: { paperSize: 9, orientation: 'portrait', scale: 80 },
      cells: [createCell({ address: 'B2', row: 2, col: 2, value: 'test' })],
    });

    const result100 = parseSheet(sheet100);
    const result80 = parseSheet(sheet80);

    // 80% のボックスは 100% より小さい
    const pos100 = result100.boxes[0]?.rect.position;
    expect(result80.boxes[0]?.rect.position.x).toBeCloseTo((pos100?.x ?? 0) * 0.8, 2);
    expect(result80.boxes[0]?.rect.position.y).toBeCloseTo((pos100?.y ?? 0) * 0.8, 2);
  });

  it('margins が null の場合はデフォルト余白を使用する', () => {
    const result = parseSheet(createMinimalSheet({ margins: null }));

    expect(result.paper.margins.top).toBe(1.0);
    expect(result.paper.margins.left).toBe(0.75);
  });

  it('不正なボーダースタイルは thin にフォールバックする', () => {
    const result = parseSheet(
      createMinimalSheet({
        cells: [
          createCell({
            address: 'A1',
            row: 1,
            col: 1,
            value: '',
            style: {
              border: { top: { style: 'slantDashDot', color: '000000' } },
            },
          }),
        ],
      }),
    );

    expect(result.boxes[0]?.border.top?.style).toBe('thin');
  });

  it('範囲外セルは無視される', () => {
    const result = parseSheet(
      createMinimalSheet({
        columnWidths: [8.43],
        rowHeights: [15],
        cells: [
          createCell({ address: 'A1', row: 1, col: 1, value: '範囲内' }),
          createCell({ address: 'Z99', row: 99, col: 26, value: '範囲外' }),
        ],
      }),
    );

    expect(result.boxes).toHaveLength(1);
    expect(result.boxes[0]?.content).toBe('範囲内');
  });
});

// --- parsePrintArea テスト ---

describe('parsePrintArea', () => {
  it('undefined → null', () => {
    expect(parsePrintArea(undefined)).toBeNull();
  });

  it('空文字 → null', () => {
    expect(parsePrintArea('')).toBeNull();
  });

  it('A1:D20 を正しくパースする', () => {
    expect(parsePrintArea('A1:D20')).toEqual({
      startCol: 1,
      startRow: 1,
      endCol: 4,
      endRow: 20,
    });
  });

  it('シート名プレフィックス付きをパースする', () => {
    expect(parsePrintArea("'Sheet1'!A1:D20")).toEqual({
      startCol: 1,
      startRow: 1,
      endCol: 4,
      endRow: 20,
    });
  });

  it('絶対参照（$付き）をパースする', () => {
    expect(parsePrintArea('$A$1:$D$20')).toEqual({
      startCol: 1,
      startRow: 1,
      endCol: 4,
      endRow: 20,
    });
  });

  it('シート名 + 絶対参照の組み合わせ', () => {
    expect(parsePrintArea("'テスト'!$B$3:$F$50")).toEqual({
      startCol: 2,
      startRow: 3,
      endCol: 6,
      endRow: 50,
    });
  });
});

// --- applyPrintArea テスト ---

describe('applyPrintArea', () => {
  it('printArea 未設定の場合はデータをそのまま返す', () => {
    const sheet = createMinimalSheet();
    const result = applyPrintArea(sheet);
    expect(result).toBe(sheet);
  });

  it('printArea で列幅を切り出す', () => {
    const sheet = createMinimalSheet({
      pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'B1:C3' },
      columnWidths: [10, 20, 30],
      rowHeights: [15, 15, 15],
      cells: [],
      merges: [],
    });

    const result = applyPrintArea(sheet);
    // B=col2, C=col3 → slice(1, 3) = [20, 30]
    expect(result.columnWidths).toEqual([20, 30]);
  });

  it('printArea で行高を切り出す', () => {
    const sheet = createMinimalSheet({
      pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'A2:C3' },
      columnWidths: [8.43, 8.43, 8.43],
      rowHeights: [10, 20, 30],
      cells: [],
      merges: [],
    });

    const result = applyPrintArea(sheet);
    // row2~3 → slice(1, 3) = [20, 30]
    expect(result.rowHeights).toEqual([20, 30]);
  });

  it('印刷領域外のセルをフィルタリングする', () => {
    const sheet = createMinimalSheet({
      pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'B2:C3' },
      columnWidths: [8.43, 8.43, 8.43],
      rowHeights: [15, 15, 15],
      cells: [
        createCell({ address: 'A1', row: 1, col: 1, value: '範囲外1' }),
        createCell({ address: 'B2', row: 2, col: 2, value: '範囲内1' }),
        createCell({ address: 'C3', row: 3, col: 3, value: '範囲内2' }),
        createCell({ address: 'A3', row: 3, col: 1, value: '範囲外2' }),
      ],
      merges: [],
    });

    const result = applyPrintArea(sheet);
    expect(result.cells).toHaveLength(2);
    expect(result.cells[0]?.value).toBe('範囲内1');
    expect(result.cells[1]?.value).toBe('範囲内2');
  });

  it('セルの row/col を印刷領域起点にリマップする', () => {
    const sheet = createMinimalSheet({
      pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'B2:C3' },
      columnWidths: [8.43, 8.43, 8.43],
      rowHeights: [15, 15, 15],
      cells: [
        createCell({ address: 'B2', row: 2, col: 2, value: '左上' }),
        createCell({ address: 'C3', row: 3, col: 3, value: '右下' }),
      ],
      merges: [],
    });

    const result = applyPrintArea(sheet);
    // B2 → row:1, col:1（リマップ後）
    expect(result.cells[0]?.row).toBe(1);
    expect(result.cells[0]?.col).toBe(1);
    expect(result.cells[0]?.address).toBe('A1');
    // C3 → row:2, col:2（リマップ後）
    expect(result.cells[1]?.row).toBe(2);
    expect(result.cells[1]?.col).toBe(2);
    expect(result.cells[1]?.address).toBe('B2');
  });

  it('結合範囲を印刷領域内にクリップ・リマップする', () => {
    const sheet = createMinimalSheet({
      pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'B2:D4' },
      columnWidths: [8.43, 8.43, 8.43, 8.43],
      rowHeights: [15, 15, 15, 15],
      cells: [],
      merges: ['B2:C3', 'A1:A2'],
    });

    const result = applyPrintArea(sheet);
    // B2:C3 → リマップ: A1:B2
    expect(result.merges).toContain('A1:B2');
    // A1:A2 は印刷領域外なので除外
    expect(result.merges).toHaveLength(1);
  });
});

// --- parseSheet + printArea 統合テスト ---

describe('parseSheet with printArea', () => {
  it('printArea が設定されている場合、領域内のセルのみ Box に変換する', () => {
    const result = parseSheet(
      createMinimalSheet({
        pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'A1:B2' },
        columnWidths: [8.43, 8.43, 8.43],
        rowHeights: [15, 15, 15],
        cells: [
          createCell({ address: 'A1', row: 1, col: 1, value: '領域内' }),
          createCell({ address: 'B2', row: 2, col: 2, value: '領域内2' }),
          createCell({ address: 'C3', row: 3, col: 3, value: '領域外' }),
        ],
        merges: [],
      }),
    );

    expect(result.boxes).toHaveLength(2);
    expect(result.boxes[0]?.content).toBe('領域内');
    expect(result.boxes[1]?.content).toBe('領域内2');
  });

  it('printArea の先頭セルが原点(0,0)にマップされる', () => {
    const result = parseSheet(
      createMinimalSheet({
        pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'B2:C3' },
        columnWidths: [8.43, 8.43, 8.43],
        rowHeights: [15, 15, 15],
        cells: [createCell({ address: 'B2', row: 2, col: 2, value: '起点' })],
        merges: [],
      }),
    );

    expect(result.boxes).toHaveLength(1);
    expect(result.boxes[0]?.rect.position.x).toBe(0);
    expect(result.boxes[0]?.rect.position.y).toBe(0);
  });

  it('printArea 内の結合セルが正しく変換される', () => {
    const result = parseSheet(
      createMinimalSheet({
        pageSetup: { paperSize: 9, orientation: 'portrait', scale: 100, printArea: 'B2:D4' },
        columnWidths: [8.43, 8.43, 8.43, 8.43],
        rowHeights: [15, 15, 15, 15],
        cells: [
          createCell({
            address: 'B2',
            row: 2,
            col: 2,
            value: '結合',
            isMerged: true,
            mergeRange: 'B2:C3',
          }),
          createCell({ address: 'C2', row: 2, col: 3, value: '', isMerged: true }),
          createCell({ address: 'B3', row: 3, col: 2, value: '', isMerged: true }),
          createCell({ address: 'C3', row: 3, col: 3, value: '', isMerged: true }),
        ],
        merges: ['B2:C3'],
      }),
    );

    expect(result.boxes).toHaveLength(1);
    expect(result.boxes[0]?.content).toBe('結合');
    // 結合セルは 2列×2行分のサイズ
    expect(result.boxes[0]?.rect.position.x).toBe(0);
    expect(result.boxes[0]?.rect.position.y).toBe(0);
  });
});
