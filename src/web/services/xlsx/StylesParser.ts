import type { RawCellStyle } from '@domain/excel';
import { XMLParser } from 'fast-xml-parser';
import { INDEXED_COLORS } from './IndexedColors';
import { applyTint } from './ThemeParser';
import type {
  BorderEdgeEntry,
  BorderEntry,
  FillEntry,
  FontEntry,
  ParsedStyles,
  ThemeColorPalette,
  XfEntry,
} from './types';

const ARRAY_TAGS = new Set(['font', 'fill', 'border', 'xf', 'numFmt']);

/**
 * xl/styles.xml をパースし、フォント・塗り・罫線・セル書式のテーブルを返す。
 */
export function parseStyles(xml: string, themePalette?: ThemeColorPalette): ParsedStyles {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    htmlEntities: true,
    trimValues: false,
    isArray: (name) => ARRAY_TAGS.has(name),
  });

  const doc = parser.parse(xml);
  const ss = doc?.styleSheet;
  if (!ss) return emptyStyles();

  return {
    fonts: parseFonts(ss.fonts, themePalette),
    fills: parseFills(ss.fills, themePalette),
    borders: parseBorders(ss.borders, themePalette),
    cellXfs: parseCellXfs(ss.cellXfs),
    numFmts: parseNumFmts(ss.numFmts),
  };
}

/**
 * セルのスタイルインデックスから RawCellStyle を解決する。
 */
export function resolveStyle(styleIndex: number, styles: ParsedStyles): RawCellStyle {
  const xf = styles.cellXfs[styleIndex];
  if (!xf) return {};

  const result: RawCellStyle = {};
  const font = styles.fonts[xf.fontId];
  const fill = styles.fills[xf.fillId];
  const border = styles.borders[xf.borderId];

  return {
    ...(font && hasFontData(font) ? { font } : {}),
    ...(fill?.color ? { fill: { color: fill.color } } : {}),
    ...(border && hasBorderData(border)
      ? {
          border: {
            ...(border.top ? { top: border.top } : {}),
            ...(border.bottom ? { bottom: border.bottom } : {}),
            ...(border.left ? { left: border.left } : {}),
            ...(border.right ? { right: border.right } : {}),
          },
        }
      : {}),
    ...(xf.alignment ? { alignment: xf.alignment } : {}),
    ...result,
  };
}

// --- Fonts ---

function parseFonts(fontsNode: unknown, palette?: ThemeColorPalette): FontEntry[] {
  const list = extractArray(fontsNode, 'font');
  return list.map((n) => parseSingleFont(n, palette));
}

function parseSingleFont(node: unknown, palette?: ThemeColorPalette): FontEntry {
  if (!isObj(node)) return {};
  const o = node as Record<string, unknown>;
  return {
    name: attrStr(o.name, '@_val') ?? textStr(o.name),
    size: attrNum(o.sz, '@_val'),
    bold: 'b' in o ? true : undefined,
    italic: 'i' in o ? true : undefined,
    color: extractColor(o.color, palette),
  };
}

// --- Fills ---

function parseFills(fillsNode: unknown, palette?: ThemeColorPalette): FillEntry[] {
  const list = extractArray(fillsNode, 'fill');
  return list.map((n) => parseSingleFill(n, palette));
}

function parseSingleFill(node: unknown, palette?: ThemeColorPalette): FillEntry {
  if (!isObj(node)) return {};
  const o = node as Record<string, unknown>;
  const pf = o.patternFill as Record<string, unknown> | undefined;
  if (!pf) return {};

  const patternType = attrStr(pf, '@_patternType');
  if (patternType !== 'solid') return {};

  const color = extractColor(pf.fgColor, palette);
  return color ? { color } : {};
}

// --- Borders ---

function parseBorders(bordersNode: unknown, palette?: ThemeColorPalette): BorderEntry[] {
  const list = extractArray(bordersNode, 'border');
  return list.map((n) => parseSingleBorder(n, palette));
}

function parseSingleBorder(node: unknown, palette?: ThemeColorPalette): BorderEntry {
  if (!isObj(node)) return {};
  const o = node as Record<string, unknown>;
  return {
    top: parseBorderEdge(o.top, palette),
    bottom: parseBorderEdge(o.bottom, palette),
    left: parseBorderEdge(o.left, palette),
    right: parseBorderEdge(o.right, palette),
  };
}

function parseBorderEdge(edge: unknown, palette?: ThemeColorPalette): BorderEdgeEntry | undefined {
  if (!isObj(edge)) return undefined;
  const o = edge as Record<string, unknown>;
  const style = attrStr(o, '@_style');
  if (!style || style === 'none') return undefined;
  return { style, color: extractColor(o.color, palette) };
}

// --- CellXfs ---

function parseCellXfs(xfsNode: unknown): XfEntry[] {
  const list = extractArray(xfsNode, 'xf');
  return list.map(parseSingleXf);
}

function parseSingleXf(node: unknown): XfEntry {
  if (!isObj(node)) return { fontId: 0, fillId: 0, borderId: 0, numFmtId: 0 };
  const o = node as Record<string, unknown>;

  const alignment = parseAlignment(o.alignment);

  return {
    fontId: toNum(o['@_fontId']),
    fillId: toNum(o['@_fillId']),
    borderId: toNum(o['@_borderId']),
    numFmtId: toNum(o['@_numFmtId']),
    applyFont: toBool(o['@_applyFont']),
    applyFill: toBool(o['@_applyFill']),
    applyBorder: toBool(o['@_applyBorder']),
    applyAlignment: toBool(o['@_applyAlignment']),
    ...(alignment ? { alignment } : {}),
  };
}

function parseAlignment(
  node: unknown,
): { horizontal?: string; vertical?: string; wrapText?: boolean } | undefined {
  if (!isObj(node)) return undefined;
  const o = node as Record<string, unknown>;
  const h = attrStr(o, '@_horizontal');
  const v = attrStr(o, '@_vertical');
  const w = toBool(o['@_wrapText']);
  if (!h && !v && !w) return undefined;
  return {
    ...(h ? { horizontal: h } : {}),
    ...(v ? { vertical: v } : {}),
    ...(w ? { wrapText: w } : {}),
  };
}

// --- NumFmts ---

function parseNumFmts(numFmtsNode: unknown): Map<number, string> {
  const map = new Map<number, string>();
  const list = extractArray(numFmtsNode, 'numFmt');
  for (const item of list) {
    if (!isObj(item)) continue;
    const o = item as Record<string, unknown>;
    const id = toNum(o['@_numFmtId']);
    const code = attrStr(o, '@_formatCode');
    if (code !== undefined) {
      map.set(id, code);
    }
  }
  return map;
}

// --- Color ---

/** ARGB "FF000000" → "000000" (6桁hex) */
function argbToHex(argb: string): string {
  return argb.length === 8 ? argb.slice(2) : argb;
}

function extractColor(colorNode: unknown, palette?: ThemeColorPalette): string | undefined {
  if (!isObj(colorNode)) return undefined;
  const o = colorNode as Record<string, unknown>;

  // 1. RGB 直指定（最優先）
  const rgb = o['@_rgb'];
  if (typeof rgb === 'string' && rgb.length >= 6) return argbToHex(rgb);

  // 2. テーマカラー
  const themeVal = o['@_theme'];
  if (themeVal !== undefined && themeVal !== null) {
    const themeIdx = Number(themeVal);
    if (!Number.isNaN(themeIdx) && palette && themeIdx < palette.length) {
      const baseColor = palette[themeIdx];
      if (baseColor) {
        const tintVal = o['@_tint'];
        if (tintVal !== undefined && tintVal !== null) {
          const tint = Number(tintVal);
          if (!Number.isNaN(tint)) return applyTint(baseColor, tint);
        }
        return baseColor;
      }
    }
  }

  // 3. インデックスカラー
  const indexedVal = o['@_indexed'];
  if (indexedVal !== undefined && indexedVal !== null) {
    const idx = Number(indexedVal);
    if (!Number.isNaN(idx) && idx >= 0 && idx < INDEXED_COLORS.length) {
      return INDEXED_COLORS[idx];
    }
  }

  return undefined;
}

// --- Helpers ---

function emptyStyles(): ParsedStyles {
  return { fonts: [], fills: [], borders: [], cellXfs: [], numFmts: new Map() };
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

function attrStr(node: unknown, attr: string): string | undefined {
  if (!isObj(node)) return undefined;
  const v = (node as Record<string, unknown>)[attr];
  return typeof v === 'string' ? v : v !== null && v !== undefined ? String(v) : undefined;
}

function textStr(node: unknown): string | undefined {
  if (typeof node === 'string') return node;
  return undefined;
}

function attrNum(node: unknown, attr: string): number | undefined {
  const s = attrStr(node, attr);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function toBool(v: unknown): boolean | undefined {
  if (v === '1' || v === 'true' || v === true) return true;
  if (v === '0' || v === 'false' || v === false) return false;
  return undefined;
}

function hasFontData(f: FontEntry): boolean {
  return !!(f.name || f.size || f.bold || f.italic || f.color);
}

function hasBorderData(b: BorderEntry): boolean {
  return !!(b.top || b.bottom || b.left || b.right);
}
