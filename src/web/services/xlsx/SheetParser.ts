import type { RawCell, RawCellStyle, RawPageSetup } from '@domain/excel';
import type { Margins } from '@domain/paper';
import { XMLParser } from 'fast-xml-parser';
import { resolveCellValue } from './CellValueResolver';
import { resolveStyle } from './StylesParser';
import type { ParsedStyles } from './types';

const ARRAY_TAGS = new Set(['row', 'c', 'col', 'mergeCell', 'brk']);

const DEFAULT_COL_WIDTH = 8.43;
const DEFAULT_ROW_HEIGHT = 15;

/** SheetParser の出力（XlsxReader が RawSheetData に組み立てる） */
export type SheetParseResult = {
  readonly cells: readonly RawCell[];
  readonly merges: readonly string[];
  readonly columnWidths: readonly number[];
  readonly rowHeights: readonly number[];
  readonly pageSetup: RawPageSetup;
  readonly margins: Margins | null;
  readonly rowBreaks: readonly number[];
};

/**
 * xl/worksheets/sheetN.xml をパースし、セル・結合・列幅・行高・ページ設定等を返す。
 */
export function parseWorksheet(
  xml: string,
  sharedStrings: readonly string[],
  styles: ParsedStyles | null,
): SheetParseResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: false,
    isArray: (name) => ARRAY_TAGS.has(name),
  });

  const doc = parser.parse(xml);
  const ws = doc?.worksheet;
  if (!ws) return emptyResult();

  const sheetFormatPr = ws.sheetFormatPr as Record<string, unknown> | undefined;
  const defaultColW = toNumOr(sheetFormatPr?.['@_defaultColWidth'], DEFAULT_COL_WIDTH);
  const defaultRowH = toNumOr(sheetFormatPr?.['@_defaultRowHeight'], DEFAULT_ROW_HEIGHT);

  const columnWidths = parseColumns(ws.cols, defaultColW);
  const { cells, maxRow, maxCol } = parseCells(ws.sheetData, sharedStrings, styles, defaultRowH);
  const rowHeightMap = parseRowHeights(ws.sheetData, defaultRowH);

  // 行高配列を構築（1-indexed → 0-indexed）
  const totalRows = Math.max(maxRow, rowHeightMap.size > 0 ? Math.max(...rowHeightMap.keys()) : 0);
  const rowHeights: number[] = [];
  for (let r = 1; r <= totalRows; r++) {
    rowHeights.push(rowHeightMap.get(r) ?? defaultRowH);
  }

  // 列幅配列を拡張（セルが列幅定義より多い場合）
  const totalCols = Math.max(maxCol, columnWidths.length);
  while (columnWidths.length < totalCols) {
    columnWidths.push(defaultColW);
  }

  return {
    cells,
    merges: parseMerges(ws.mergeCells),
    columnWidths,
    rowHeights,
    pageSetup: parsePageSetup(ws.pageSetup),
    margins: parseMargins(ws.pageMargins),
    rowBreaks: parseRowBreaks(ws.rowBreaks),
  };
}

// --- Cells ---

function parseCells(
  sheetData: unknown,
  sharedStrings: readonly string[],
  styles: ParsedStyles | null,
  _defaultRowH: number,
): { cells: RawCell[]; maxRow: number; maxCol: number } {
  const rows = extractArray(sheetData, 'row');
  const cells: RawCell[] = [];
  let maxRow = 0;
  let maxCol = 0;

  for (const row of rows) {
    if (!isObj(row)) continue;
    const o = row as Record<string, unknown>;
    const cellElements = extractArray(o, 'c');

    for (const c of cellElements) {
      if (!isObj(c)) continue;
      const co = c as Record<string, unknown>;
      const ref = String(co['@_r'] ?? '');
      if (!ref) continue;

      const { row: rowNum, col: colNum } = parseRef(ref);
      if (rowNum === 0 || colNum === 0) continue;

      maxRow = Math.max(maxRow, rowNum);
      maxCol = Math.max(maxCol, colNum);

      const type = co['@_t'] as string | undefined;
      const styleIdx = toNumOr(co['@_s'], -1);
      const valueText = extractText(co.v);
      const formulaText = extractText(co.f);
      const inlineStr = extractInlineStr(co.is);

      const value = resolveCellValue(type, valueText, formulaText, inlineStr, sharedStrings);
      const style: RawCellStyle = styles && styleIdx >= 0 ? resolveStyle(styleIdx, styles) : {};

      // 値もスタイルもない空セルはスキップ
      if (!value && !hasStyle(style) && formulaText === undefined) continue;

      cells.push({
        address: ref,
        row: rowNum,
        col: colNum,
        value,
        style,
        isMerged: false, // XlsxReader が結合情報から設定する
      });
    }
  }

  return { cells, maxRow, maxCol };
}

// --- Row Heights ---

function parseRowHeights(sheetData: unknown, defaultRowH: number): Map<number, number> {
  const rows = extractArray(sheetData, 'row');
  const map = new Map<number, number>();

  for (const row of rows) {
    if (!isObj(row)) continue;
    const o = row as Record<string, unknown>;
    const r = toNumOr(o['@_r'], 0);
    if (r === 0) continue;
    const ht = toNumOr(o['@_ht'], -1);
    map.set(r, ht >= 0 ? ht : defaultRowH);
  }

  return map;
}

// --- Columns ---

function parseColumns(colsNode: unknown, defaultWidth: number): number[] {
  const cols = extractArray(colsNode, 'col');
  const widths: number[] = [];

  for (const col of cols) {
    if (!isObj(col)) continue;
    const o = col as Record<string, unknown>;
    const min = toNumOr(o['@_min'], 0);
    const max = toNumOr(o['@_max'], 0);
    const width = toNumOr(o['@_width'], defaultWidth);

    for (let c = min; c <= max; c++) {
      // 0-indexed 配列に格納（col 1 → index 0）
      while (widths.length < c) widths.push(defaultWidth);
      widths[c - 1] = width;
    }
  }

  return widths;
}

// --- Merges ---

function parseMerges(mergeCellsNode: unknown): string[] {
  const items = extractArray(mergeCellsNode, 'mergeCell');
  return items
    .filter(isObj)
    .map((o) => String((o as Record<string, unknown>)['@_ref'] ?? ''))
    .filter((ref) => ref !== '');
}

// --- Page Setup ---

function parsePageSetup(node: unknown): RawPageSetup {
  if (!isObj(node)) return {};
  const o = node as Record<string, unknown>;

  const fitToPage = toBool(o['@_fitToPage']);

  return {
    ...(o['@_paperSize'] !== undefined ? { paperSize: toNumOr(o['@_paperSize'], undefined) } : {}),
    ...(o['@_orientation'] ? { orientation: String(o['@_orientation']) } : {}),
    ...(o['@_scale'] !== undefined ? { scale: toNumOr(o['@_scale'], undefined) } : {}),
    ...(fitToPage !== undefined ? { fitToPage } : {}),
    ...(o['@_fitToWidth'] !== undefined
      ? { fitToWidth: toNumOr(o['@_fitToWidth'], undefined) }
      : {}),
    ...(o['@_fitToHeight'] !== undefined
      ? { fitToHeight: toNumOr(o['@_fitToHeight'], undefined) }
      : {}),
  };
}

// --- Margins ---

function parseMargins(node: unknown): Margins | null {
  if (!isObj(node)) return null;
  const o = node as Record<string, unknown>;
  return {
    top: toNumOr(o['@_top'], 0),
    bottom: toNumOr(o['@_bottom'], 0),
    left: toNumOr(o['@_left'], 0),
    right: toNumOr(o['@_right'], 0),
    header: toNumOr(o['@_header'], 0),
    footer: toNumOr(o['@_footer'], 0),
  };
}

// --- Row Breaks ---

function parseRowBreaks(node: unknown): number[] {
  const brks = extractArray(node, 'brk');
  return brks
    .filter(isObj)
    .map((o) => toNumOr((o as Record<string, unknown>)['@_id'], 0))
    .filter((id) => id > 0);
}

// --- Cell Reference Parsing ---

/** "A1" → { row: 1, col: 1 }, "AB123" → { row: 123, col: 28 } */
function parseRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match?.[1] || !match[2]) return { row: 0, col: 0 };
  return { row: Number(match[2]), col: letterToCol(match[1]) };
}

function letterToCol(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result;
}

/** <is><t>text</t></is> or <is><r><t>text</t></r>...</is> */
function extractInlineStr(isNode: unknown): string | undefined {
  if (!isObj(isNode)) return undefined;
  const o = isNode as Record<string, unknown>;

  // <is><t>text</t></is>
  if ('t' in o) return extractText(o.t) ?? '';

  // <is><r><t>text</t></r>...</is>
  if ('r' in o) {
    const runs = Array.isArray(o.r) ? o.r : [o.r];
    return runs
      .map((run) => {
        if (!isObj(run)) return '';
        return extractText((run as Record<string, unknown>).t) ?? '';
      })
      .join('');
  }

  return undefined;
}

// --- Helpers ---

function emptyResult(): SheetParseResult {
  return {
    cells: [],
    merges: [],
    columnWidths: [],
    rowHeights: [],
    pageSetup: {},
    margins: null,
    rowBreaks: [],
  };
}

function extractArray(parent: unknown, childKey: string): unknown[] {
  if (!isObj(parent)) return [];
  const obj = parent as Record<string, unknown>;
  const child = obj[childKey];
  if (Array.isArray(child)) return child;
  if (child !== null && child !== undefined) return [child];
  return [];
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function extractText(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (isObj(v) && '#text' in (v as Record<string, unknown>)) {
    const text = (v as Record<string, unknown>)['#text'];
    return text !== null && text !== undefined ? String(text) : undefined;
  }
  return undefined;
}

function toNumOr<T>(v: unknown, fallback: T): number | T {
  if (v === undefined || v === null) return fallback;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

function toBool(v: unknown): boolean | undefined {
  if (v === '1' || v === 'true' || v === true) return true;
  if (v === '0' || v === 'false' || v === false) return false;
  return undefined;
}

function hasStyle(s: RawCellStyle): boolean {
  return !!(s.font || s.border || s.fill || s.alignment);
}
