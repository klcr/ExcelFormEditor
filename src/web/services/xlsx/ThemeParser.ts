import { XMLParser } from 'fast-xml-parser';
import type { ThemeColorPalette } from './types';

/**
 * OOXML テーマインデックス → clrScheme 要素名の対応。
 * Excel の <color theme="N"> は以下の順序でパレットを参照する。
 */
const THEME_INDEX_KEYS = [
  'lt1', // 0: Light 1 (通常は白系)
  'dk1', // 1: Dark 1 (通常は黒系)
  'lt2', // 2: Light 2
  'dk2', // 3: Dark 2
  'accent1', // 4
  'accent2', // 5
  'accent3', // 6
  'accent4', // 7
  'accent5', // 8
  'accent6', // 9
  'hlink', // 10: Hyperlink
  'folHlink', // 11: Followed Hyperlink
] as const;

/**
 * xl/theme/theme1.xml をパースし、12 色のテーマカラーパレットを返す。
 */
export function parseThemeColors(xml: string): ThemeColorPalette {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  const doc = parser.parse(xml);
  const clrScheme = doc?.theme?.themeElements?.clrScheme ?? doc?.theme?.themeElements?.clrScheme;
  if (!clrScheme) return defaultPalette();

  return THEME_INDEX_KEYS.map((key) => extractSchemeColor(clrScheme[key]));
}

function extractSchemeColor(node: unknown): string {
  if (!node || typeof node !== 'object') return '000000';
  const o = node as Record<string, unknown>;

  // <a:srgbClr val="RRGGBB"/>
  const srgb = o.srgbClr as Record<string, unknown> | undefined;
  if (srgb) {
    const val = srgb['@_val'];
    if (typeof val === 'string' && val.length >= 6) return val.toUpperCase();
  }

  // <a:sysClr val="windowText" lastClr="000000"/>
  const sys = o.sysClr as Record<string, unknown> | undefined;
  if (sys) {
    const lastClr = sys['@_lastClr'];
    if (typeof lastClr === 'string' && lastClr.length >= 6) return lastClr.toUpperCase();
  }

  return '000000';
}

function defaultPalette(): ThemeColorPalette {
  return [
    'FFFFFF',
    '000000',
    'E7E6E6',
    '44546A',
    '4472C4',
    'ED7D31',
    'A5A5A5',
    'FFC000',
    '5B9BD5',
    '70AD47',
    '0563C1',
    '954F72',
  ];
}

// --- Tint ---

/**
 * テーマカラーに tint（色調）を適用する。
 * OOXML 仕様: tint > 0 → 白方向、tint < 0 → 黒方向。
 */
export function applyTint(hexColor: string, tint: number): string {
  if (tint === 0) return hexColor;

  const r = Number.parseInt(hexColor.slice(0, 2), 16);
  const g = Number.parseInt(hexColor.slice(2, 4), 16);
  const b = Number.parseInt(hexColor.slice(4, 6), 16);

  const [h, s, l] = rgbToHsl(r, g, b);
  const newL = tint > 0 ? l + (1 - l) * tint : l * (1 + tint);
  const [nr, ng, nb] = hslToRgb(h, s, Math.max(0, Math.min(1, newL)));

  return toHex(nr) + toHex(ng) + toHex(nb);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function toHex(n: number): string {
  const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
  return hex.length < 2 ? `0${hex}` : hex.toUpperCase();
}
