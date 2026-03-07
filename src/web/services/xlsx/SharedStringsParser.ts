import { XMLParser } from 'fast-xml-parser';

/**
 * xl/sharedStrings.xml をパースし、共有文字列の配列を返す。
 *
 * OOXML の共有文字列テーブル:
 *   <sst><si><t>plain text</t></si></sst>
 *   <sst><si><r><rPr>...</rPr><t>rich</t></r><r><t> text</t></r></si></sst>
 */
export function parseSharedStrings(xml: string): string[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    htmlEntities: true,
    trimValues: false,
    isArray: (name) => name === 'si' || name === 'r',
  });

  const doc = parser.parse(xml);
  const siList: unknown[] = doc?.sst?.si ?? [];
  return siList.map(extractSiText);
}

/** <si> 要素から文字列を取り出す */
function extractSiText(si: unknown): string {
  if (si === null || si === undefined || typeof si !== 'object') return '';
  const obj = si as Record<string, unknown>;

  // パターン1: <si><t>plain text</t></si>
  if ('t' in obj && !('r' in obj)) {
    return stringValue(obj.t);
  }

  // パターン2: <si><r>...<t>text</t></r></si> (リッチテキスト)
  if ('r' in obj) {
    const runs = obj.r as unknown[];
    return runs.map(extractRunText).join('');
  }

  return '';
}

/** <r> (run) 要素から <t> テキストを取り出す */
function extractRunText(run: unknown): string {
  if (run === null || run === undefined || typeof run !== 'object') return '';
  const obj = run as Record<string, unknown>;
  return stringValue(obj.t);
}

/** fast-xml-parser の値を文字列に変換（数値やブールの場合がある） */
function stringValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  // <t> に属性がある場合: { '#text': '...', '@_xml:space': 'preserve' }
  if (typeof v === 'object' && '#text' in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>)['#text'] ?? '');
  }
  return '';
}
