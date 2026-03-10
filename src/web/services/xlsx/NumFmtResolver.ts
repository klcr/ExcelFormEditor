/**
 * 数値フォーマット解決モジュール。
 * OOXML の numFmtId からセル値を書式適用済み文字列に変換する。
 * 80%ルール: 日付・パーセント・桁区切りの 3 パターンをカバー。
 */

/** 組み込み数値フォーマット ID (0-49) のフォーマットコード */
const BUILTIN_NUM_FMTS = new Map<number, string>([
  [0, 'General'],
  [1, '0'],
  [2, '0.00'],
  [3, '#,##0'],
  [4, '#,##0.00'],
  [5, '#,##0"¥"'],
  [6, '#,##0"¥";[Red]#,##0"¥"'],
  [7, '#,##0.00"¥"'],
  [8, '#,##0.00"¥";[Red]#,##0.00"¥"'],
  [9, '0%'],
  [10, '0.00%'],
  [11, '0.00E+00'],
  [12, '# ?/?'],
  [13, '# ??/??'],
  [14, 'yyyy/mm/dd'],
  [15, 'd-mmm-yy'],
  [16, 'd-mmm'],
  [17, 'mmm-yy'],
  [18, 'h:mm AM/PM'],
  [19, 'h:mm:ss AM/PM'],
  [20, 'h:mm'],
  [21, 'h:mm:ss'],
  [22, 'yyyy/mm/dd h:mm'],
  [27, 'yyyy"年"m"月"d"日"'],
  [28, 'm"月"d"日"'],
  [29, 'm"月"d"日"'],
  [30, 'm/d/yy'],
  [31, 'yyyy"年"m"月"d"日"'],
  [32, 'h"時"mm"分"'],
  [33, 'h"時"mm"分"ss"秒"'],
  [34, 'yyyy"年"m"月"'],
  [35, 'm"月"d"日"'],
  [36, 'yyyy/m/d'],
  [37, '#,##0 ;(#,##0)'],
  [38, '#,##0 ;[Red](#,##0)'],
  [39, '#,##0.00;(#,##0.00)'],
  [40, '#,##0.00;[Red](#,##0.00)'],
  [41, '_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)'],
  [42, '_("¥"* #,##0_);_("¥"* (#,##0);_("¥"* "-"_);_(@_)'],
  [43, '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)'],
  [44, '_("¥"* #,##0.00_);_("¥"* (#,##0.00);_("¥"* "-"??_);_(@_)'],
  [45, 'mm:ss'],
  [46, '[h]:mm:ss'],
  [47, 'mmss.0'],
  [48, '##0.0E+0'],
  [49, '@'],
]);

/**
 * フォーマットコードが日付/時刻かどうかを判定する。
 * ヒューリスティック: y, d, h, s の存在、または m が h/s の近くにある場合を日付とみなす。
 * リテラル文字列（"..."）内の文字は除外する。
 */
export function isDateFormat(formatCode: string): boolean {
  // リテラル文字列を除去
  const stripped = formatCode.replace(/"[^"]*"/g, '').replace(/\\./g, '');
  // 色指定 [Red] 等を除去
  const cleaned = stripped.replace(/\[[^\]]*\]/g, '');

  // y, d, h, s があれば日付/時刻
  if (/[ydhsYDHS]/.test(cleaned)) return true;

  // m 単独は月（数値フォーマットの m はない）、ただし General は除く
  if (/[mM]/.test(cleaned) && !/^General$/i.test(formatCode)) {
    // m が数値フォーマットのパターン（0, #, ?）と共存しなければ日付
    if (!/[0#?]/.test(cleaned)) return true;
  }

  return false;
}

/** フォーマットコードがパーセントかどうかを判定する */
export function isPercentFormat(formatCode: string): boolean {
  const stripped = formatCode.replace(/"[^"]*"/g, '');
  return stripped.includes('%');
}

/**
 * numFmtId に基づいてセル値をフォーマットする。
 * @param rawValue セルの生値（<v> 要素の文字列）
 * @param numFmtId スタイルの numFmtId
 * @param customNumFmts カスタム numFmt テーブル（styles.xml の <numFmts>）
 * @returns フォーマット済み文字列
 */
export function formatCellValue(
  rawValue: string,
  numFmtId: number,
  customNumFmts: ReadonlyMap<number, string>,
): string {
  if (!rawValue) return rawValue;

  // numFmtId=0 (General) や 49 (@=テキスト) はそのまま
  if (numFmtId === 0 || numFmtId === 49) return rawValue;

  const formatCode = customNumFmts.get(numFmtId) ?? BUILTIN_NUM_FMTS.get(numFmtId);
  if (!formatCode) return rawValue;

  const numVal = Number(rawValue);
  if (Number.isNaN(numVal)) return rawValue;

  if (isDateFormat(formatCode)) {
    return excelSerialToDateString(numVal, formatCode);
  }

  if (isPercentFormat(formatCode)) {
    return formatPercent(numVal, formatCode);
  }

  // 桁区切り数値
  if (formatCode.includes('#') || formatCode.includes('0')) {
    return formatNumber(numVal, formatCode);
  }

  return rawValue;
}

/**
 * Excel シリアル値を日付文字列に変換する。
 * Excel は 1900/1/1 をシリアル値 1 とする。
 * 1900/2/29 バグ: Excel は 1900 年をうるう年として扱う（実際は平年）。
 * シリアル値 60 = 1900/2/29（存在しない日付）を考慮。
 */
export function excelSerialToDateString(serial: number, formatCode: string): string {
  // 時刻のみ（シリアル値 < 1）
  if (serial < 1) {
    return formatTime(serial, formatCode);
  }

  // 1900/2/29 バグ補正: serial > 59 なら 1 日引く
  const adjustedSerial = serial > 59 ? serial - 1 : serial;

  // Excel epoch: 1900/1/1 = serial 1, JS Date epoch: 1970/1/1
  // 1900/1/1 からのオフセット日数 = adjustedSerial - 1
  const msPerDay = 86400000;
  const excelEpochMs = Date.UTC(1900, 0, 1); // 1900-01-01T00:00:00Z
  const dateMs = excelEpochMs + (adjustedSerial - 1) * msPerDay;
  const date = new Date(dateMs);

  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  // 時刻部分（小数部）
  const fractional = serial - Math.floor(serial);
  const hasTime = fractional > 0 && /[hHsS]/.test(formatCode);

  const datePart = `${y}/${pad2(m)}/${pad2(d)}`;

  if (hasTime) {
    const timeStr = formatTime(fractional, formatCode);
    return `${datePart} ${timeStr}`;
  }

  return datePart;
}

function formatTime(fractional: number, _formatCode: string): string {
  const totalSeconds = Math.round(fractional * 86400);
  const h = Math.floor(totalSeconds / 3600);
  const min = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(min)}:${pad2(s)}`;
}

function formatPercent(value: number, formatCode: string): string {
  // 小数点以下の桁数を推定（"0.00%" → 2桁）
  const match = formatCode.match(/\.(\d+)%/);
  const decimals = match?.[1]?.length ?? 0;
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatNumber(value: number, formatCode: string): string {
  // 小数点以下の桁数を推定
  const match = formatCode.match(/\.(0+)/);
  const decimals = match?.[1]?.length ?? 0;

  const fixed = Math.abs(value).toFixed(decimals);

  // 桁区切り
  if (formatCode.includes(',') || formatCode.includes('#,##')) {
    const [intPart, decPart] = fixed.split('.');
    const withComma = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = decPart ? `${withComma}.${decPart}` : withComma;
    return value < 0 ? `-${formatted}` : formatted;
  }

  return value < 0 ? `-${fixed}` : fixed;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
