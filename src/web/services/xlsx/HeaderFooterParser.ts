import type { HeaderFooterSection } from '@domain/paper';

/**
 * Excel ヘッダー/フッターの生テキストを L/C/R 3セクションにパースする。
 *
 * Excel の OOXML 形式では `&L` `&C` `&R` でセクションを切り替え、
 * `&P`(ページ番号)、`&N`(総ページ数)、`&D`(日付)、`&T`(時刻)、
 * `&F`(ファイル名)、`&A`(シート名)、`&"Font,Style"`(フォント指定)、
 * `&数字`(フォントサイズ) などの特殊コードを含む。
 *
 * セクション指定がない場合、テキストは無視される（Excel 仕様準拠）。
 */
export function parseHeaderFooterContent(raw?: string): HeaderFooterSection {
  const empty: HeaderFooterSection = { left: '', center: '', right: '' };
  if (!raw) return empty;

  let left = '';
  let center = '';
  let right = '';
  /** 現在のアクティブセクション: '' = セクション未指定 */
  let active: '' | 'L' | 'C' | 'R' = '';

  let i = 0;
  while (i < raw.length) {
    const ch = raw.charAt(i);
    if (ch === '&' && i + 1 < raw.length) {
      const next = raw.charAt(i + 1);

      // セクション切り替え
      if (next === 'L' || next === 'C' || next === 'R') {
        active = next;
        i += 2;
        continue;
      }

      // フォント指定: &"FontName,Style"
      if (next === '"') {
        const closeQuote = raw.indexOf('"', i + 2);
        if (closeQuote !== -1) {
          const token = raw.substring(i, closeQuote + 1);
          append(token);
          i = closeQuote + 1;
          continue;
        }
      }

      // フォントサイズ: &12 など
      if (next >= '0' && next <= '9') {
        let num = '';
        let j = i + 1;
        while (j < raw.length && raw.charAt(j) >= '0' && raw.charAt(j) <= '9') {
          num += raw.charAt(j);
          j++;
        }
        append(`&${num}`);
        i = j;
        continue;
      }

      // 既知の特殊コード
      if ('PNDTFAKGpndtfakg'.includes(next)) {
        append(`&${next}`);
        i += 2;
        continue;
      }

      // && → リテラル &
      if (next === '&') {
        append('&');
        i += 2;
        continue;
      }

      // 未知の & コード → そのまま保持
      append(`&${next}`);
      i += 2;
      continue;
    }

    // 通常文字
    append(ch);
    i++;
  }

  function append(text: string) {
    if (active === 'L') left += text;
    else if (active === 'C') center += text;
    else if (active === 'R') right += text;
    // active === '' の場合は無視（セクション未指定テキスト）
  }

  return { left, center, right };
}
