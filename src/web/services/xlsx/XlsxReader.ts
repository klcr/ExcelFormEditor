import type { RawCell, RawSheetData } from '@domain/excel';
import JSZip from 'jszip';
import { parseSharedStrings } from './SharedStringsParser';
import { parseWorksheet } from './SheetParser';
import { parseStyles } from './StylesParser';
import { parseThemeColors } from './ThemeParser';
import { parsePrintAreas, parseWorkbook } from './WorkbookParser';

/**
 * xlsx (ArrayBuffer) を読み込み、RawSheetData[] を返す。
 * ExcelJS を使わず、JSZip + fast-xml-parser で直接 OOXML を解析する。
 */
export async function readXlsx(buffer: ArrayBuffer): Promise<RawSheetData[]> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. 共有文字列テーブル（存在しない場合がある）
  const ssXml = await readEntry(zip, 'xl/sharedStrings.xml');
  const sharedStrings = ssXml ? parseSharedStrings(ssXml) : [];

  // 2. テーマカラー + スタイル
  const themeXml = await readEntry(zip, 'xl/theme/theme1.xml');
  const themePalette = themeXml ? parseThemeColors(themeXml) : undefined;

  const stylesXml = await readEntry(zip, 'xl/styles.xml');
  const styles = stylesXml ? parseStyles(stylesXml, themePalette) : null;

  // 3. ワークブック + リレーションシップ → シート一覧
  const wbXml = await readEntry(zip, 'xl/workbook.xml');
  const relsXml = await readEntry(zip, 'xl/_rels/workbook.xml.rels');
  if (!wbXml || !relsXml) return [];

  const sheets = parseWorkbook(wbXml, relsXml);
  const printAreas = parsePrintAreas(wbXml);

  // 4. 各シートをパース
  const results: RawSheetData[] = [];

  for (const sheet of sheets) {
    const sheetXml = await readEntry(zip, sheet.path);
    if (!sheetXml) continue;

    const parsed = parseWorksheet(sheetXml, sharedStrings, styles);

    // 結合情報を解決
    const mergeSlaves = buildMergeSlaveSet(parsed.merges);
    const mergeByMaster = buildMergeByMaster(parsed.merges);

    const cells: RawCell[] = parsed.cells.map((cell) => ({
      ...cell,
      isMerged: cell.isMerged || mergeSlaves.has(cell.address),
      mergeRange: mergeByMaster.get(cell.address) ?? cell.mergeRange,
    }));

    // シートレベルの printArea が無い場合、workbook の definedNames からフォールバック
    const pageSetup =
      parsed.pageSetup.printArea || !printAreas.has(sheet.name)
        ? parsed.pageSetup
        : { ...parsed.pageSetup, printArea: printAreas.get(sheet.name) };

    results.push({
      name: sheet.name,
      pageSetup,
      margins: parsed.margins,
      columnWidths: parsed.columnWidths,
      rowHeights: parsed.rowHeights,
      cells,
      merges: parsed.merges,
      rowBreaks: parsed.rowBreaks,
    });
  }

  return results;
}

// --- Helpers ---

async function readEntry(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  return entry.async('string');
}

/**
 * 結合範囲からスレーブセルアドレスの Set を構築する。
 * "A1:C2" → A1 はマスター。A2, B1, B2, C1, C2 がスレーブ。
 */
function buildMergeSlaveSet(merges: readonly string[]): Set<string> {
  const slaves = new Set<string>();
  for (const range of merges) {
    const parsed = parseMergeRange(range);
    if (!parsed) continue;
    const { startCol, startRow, endCol, endRow } = parsed;
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const addr = colToLetter(c) + r;
        // マスター（左上）は除外
        if (r === startRow && c === startCol) continue;
        slaves.add(addr);
      }
    }
  }
  return slaves;
}

/** マスターアドレス → 結合範囲文字列のマップ */
function buildMergeByMaster(merges: readonly string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const range of merges) {
    const match = range.match(/^([A-Z]+\d+):/);
    if (match?.[1]) {
      map.set(match[1], range);
    }
  }
  return map;
}

function parseMergeRange(
  range: string,
): { startCol: number; startRow: number; endCol: number; endRow: number } | null {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match?.[1] || !match[2] || !match[3] || !match[4]) return null;
  return {
    startCol: letterToCol(match[1]),
    startRow: Number(match[2]),
    endCol: letterToCol(match[3]),
    endRow: Number(match[4]),
  };
}

function letterToCol(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result;
}

function colToLetter(col: number): string {
  let result = '';
  let n = col;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}
