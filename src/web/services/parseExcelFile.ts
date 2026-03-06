import ExcelJS from 'exceljs';

/** シートごとのパース結果 */
export type SheetParseResult = {
  readonly name: string;
  readonly pageSetup: {
    readonly paperSize: number | undefined;
    readonly orientation: string | undefined;
    readonly scale: number | undefined;
    readonly fitToPage: boolean | undefined;
    readonly fitToWidth: number | undefined;
    readonly fitToHeight: number | undefined;
    readonly printArea: string | undefined;
  };
  readonly margins: {
    readonly top: number;
    readonly bottom: number;
    readonly left: number;
    readonly right: number;
    readonly header: number;
    readonly footer: number;
  } | null;
  readonly merges: readonly string[];
  readonly columns: readonly { readonly col: number; readonly width: number | undefined }[];
  readonly rows: readonly { readonly row: number; readonly height: number }[];
  readonly cellCount: number;
  readonly sampleCells: readonly CellSample[];
};

/** セルのサンプル情報（最大20件） */
export type CellSample = {
  readonly address: string;
  readonly value: string;
  readonly type: string;
  readonly isMerged: boolean;
  readonly font: string | undefined;
  readonly hasBorder: boolean;
  readonly hasFill: boolean;
};

/** ファイル全体のパース結果 */
export type ExcelParseResult = {
  readonly fileName: string;
  readonly sheetCount: number;
  readonly sheets: readonly SheetParseResult[];
};

const MAX_SAMPLE_CELLS = 20;

/** ExcelJS の paperSize 番号を文字列に変換 */
function paperSizeLabel(ps: number | undefined): string {
  const map: Record<number, string> = { 8: 'A3', 9: 'A4', 11: 'A5' };
  if (ps === undefined) return '不明';
  return map[ps] ?? `その他(${ps})`;
}

/** セル値を表示用文字列に変換 */
function formatCellValue(value: ExcelJS.CellValue): { text: string; type: string } {
  if (value === null || value === undefined) return { text: '', type: 'empty' };
  if (typeof value === 'string') return { text: value, type: 'string' };
  if (typeof value === 'number') return { text: String(value), type: 'number' };
  if (typeof value === 'boolean') return { text: String(value), type: 'boolean' };
  if (value instanceof Date) return { text: value.toLocaleDateString('ja-JP'), type: 'date' };
  if (typeof value === 'object' && 'formula' in value) {
    return { text: `=${value.formula} → ${value.result}`, type: 'formula' };
  }
  if (typeof value === 'object' && 'richText' in value) {
    const text = value.richText.map((rt) => rt.text).join('');
    return { text, type: 'richText' };
  }
  return { text: JSON.stringify(value), type: 'object' };
}

/** File オブジェクトを ArrayBuffer として読み込む */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

/** .xlsx ファイルをパースしてデバッグ用の構造化データを返す */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  const buffer = await readFileAsArrayBuffer(file);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheets: SheetParseResult[] = [];

  workbook.eachSheet((ws) => {
    const margins = ws.pageSetup.margins;

    // 結合セル情報
    const merges = ws.model.merges ?? [];

    // 列幅（データがある列のみ）
    const columns: { col: number; width: number | undefined }[] = [];
    for (let c = 1; c <= (ws.columnCount || 0); c++) {
      const col = ws.getColumn(c);
      if (col.width !== undefined) {
        columns.push({ col: c, width: col.width });
      }
    }

    // 行高（データがある行のみ）
    const rows: { row: number; height: number }[] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      rows.push({ row: row.number, height: row.height });
    });

    // セルサンプル（最大20件）
    const sampleCells: CellSample[] = [];
    let cellCount = 0;

    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cellCount++;
        if (sampleCells.length < MAX_SAMPLE_CELLS) {
          const { text, type } = formatCellValue(cell.value);
          sampleCells.push({
            address: cell.address,
            value: text,
            type,
            isMerged: cell.isMerged,
            font: cell.font?.name,
            hasBorder: cell.border !== undefined && cell.border !== null,
            hasFill: cell.fill !== undefined && cell.fill !== null,
          });
        }
      });
    });

    sheets.push({
      name: ws.name,
      pageSetup: {
        paperSize: ws.pageSetup.paperSize,
        orientation: ws.pageSetup.orientation,
        scale: ws.pageSetup.scale,
        fitToPage: ws.pageSetup.fitToPage,
        fitToWidth: ws.pageSetup.fitToWidth,
        fitToHeight: ws.pageSetup.fitToHeight,
        printArea: ws.pageSetup.printArea,
      },
      margins: margins
        ? {
            top: margins.top,
            bottom: margins.bottom,
            left: margins.left,
            right: margins.right,
            header: margins.header,
            footer: margins.footer,
          }
        : null,
      merges,
      columns,
      rows,
      cellCount,
      sampleCells,
    });
  });

  return {
    fileName: file.name,
    sheetCount: sheets.length,
    sheets,
  };
}

export { paperSizeLabel };
