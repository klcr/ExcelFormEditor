/**
 * OOXML の <c> 要素からセル値を文字列に解決する。
 *
 * セル型属性 (t):
 *   "s"         — 共有文字列インデックス
 *   "str"       — インライン文字列（数式結果として）
 *   "inlineStr" — インライン文字列（<is> 要素内）
 *   "b"         — ブール値 ("0"/"1")
 *   "e"         — エラー ("#REF!" 等)
 *   "n" / 未指定 — 数値
 */
export function resolveCellValue(
  type: string | undefined,
  valueText: string | undefined,
  formulaText: string | undefined,
  inlineStr: string | undefined,
  sharedStrings: readonly string[],
): string {
  // 数式セル: キャッシュ結果 (<v>) を返す
  if (formulaText !== undefined) {
    if (type === 'e') return valueText ?? '';
    if (type === 'str') return valueText ?? '';
    if (type === 'b') return booleanToString(valueText);
    return valueText ?? '';
  }

  switch (type) {
    case 's': {
      const idx = Number(valueText);
      return Number.isNaN(idx) ? '' : (sharedStrings[idx] ?? '');
    }
    case 'str':
      return valueText ?? '';
    case 'inlineStr':
      return inlineStr ?? '';
    case 'b':
      return booleanToString(valueText);
    case 'e':
      return valueText ?? '';
    case 'n':
    case undefined:
      return valueText ?? '';
    default:
      return valueText ?? '';
  }
}

function booleanToString(v: string | undefined): string {
  if (v === '1') return 'true';
  if (v === '0') return 'false';
  return v ?? '';
}
