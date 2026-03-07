import { XMLParser } from 'fast-xml-parser';
import type { SheetInfo } from './types';

const ARRAY_TAGS = new Set(['sheet', 'Relationship', 'definedName']);

/**
 * xl/workbook.xml と xl/_rels/workbook.xml.rels をパースし、
 * シート一覧（名前・パス）を返す。
 */
export function parseWorkbook(workbookXml: string, relsXml: string): SheetInfo[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    htmlEntities: true,
    trimValues: false,
    isArray: (name) => ARRAY_TAGS.has(name),
  });

  const wbDoc = parser.parse(workbookXml);
  const relsDoc = parser.parse(relsXml);

  const sheets: unknown[] = wbDoc?.workbook?.sheets?.sheet ?? [];
  const rels: unknown[] = relsDoc?.Relationships?.Relationship ?? [];

  // rId → Target のマップを構築
  const relMap = new Map<string, string>();
  for (const rel of rels) {
    if (!isObj(rel)) continue;
    const o = rel as Record<string, unknown>;
    const id = String(o['@_Id'] ?? '');
    const target = String(o['@_Target'] ?? '');
    if (id && target) {
      relMap.set(id, target);
    }
  }

  return sheets
    .filter(isObj)
    .map((s) => {
      const o = s as Record<string, unknown>;
      const name = String(o['@_name'] ?? '');
      const sheetId = Number(o['@_sheetId'] ?? 0);
      // removeNSPrefix strips r: prefix from r:id → id
      const rId = String(o['@_id'] ?? o['@_r:id'] ?? '');
      const target = relMap.get(rId) ?? '';
      // Target はワークブックからの相対パス。xl/ を付加。絶対パスの場合は先頭 / を除去
      const normalizedTarget = target.startsWith('/') ? target.slice(1) : target;
      const path = normalizedTarget.startsWith('xl/') ? normalizedTarget : `xl/${normalizedTarget}`;
      return { name, sheetId, rId, path };
    })
    .filter((s) => s.name && s.path);
}

/**
 * workbook.xml の <definedNames> から印刷エリアを取得する。
 * シート名 → 印刷エリア範囲文字列のマップを返す。
 */
export function parsePrintAreas(workbookXml: string): ReadonlyMap<string, string> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    htmlEntities: true,
    trimValues: false,
    isArray: (name) => ARRAY_TAGS.has(name),
  });

  const doc = parser.parse(workbookXml);
  const names: unknown[] = doc?.workbook?.definedNames?.definedName ?? [];
  const result = new Map<string, string>();

  for (const dn of names) {
    if (!isObj(dn)) continue;
    const o = dn as Record<string, unknown>;
    const nameAttr = String(o['@_name'] ?? '');
    if (nameAttr !== '_xlnm.Print_Area') continue;

    // 値: "'Sheet1'!$A$1:$H$20" or "Sheet1!$A$1:$H$20"
    const value = String(o['#text'] ?? '');
    const match = value.match(/^'?(.+?)'?!(.+)$/);
    if (match?.[1] && match[2]) {
      result.set(match[1], match[2].replace(/\$/g, ''));
    }
  }

  return result;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
