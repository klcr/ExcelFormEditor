import type { BorderEdge, BorderStyle, BoxBorder } from '@domain/box';
import type { RawBorderEdge, RawCell } from './ExcelTypes';

/** 列番号 → 列文字（1=A, 2=B, ..., 26=Z, 27=AA） */
function columnNumberToLetter(col: number): string {
  let result = '';
  let n = col;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/** 結合範囲情報（ExcelParser の MergeInfo と同一構造） */
type MergeInfo = {
  readonly startRow: number;
  readonly startCol: number;
  readonly endRow: number;
  readonly endCol: number;
};

/** 有効な BorderStyle 値のセット */
const VALID_BORDER_STYLES = new Set<string>([
  'thin',
  'medium',
  'thick',
  'dotted',
  'dashed',
  'double',
  'hair',
  'dashDot',
  'dashDotDot',
  'mediumDashed',
  'mediumDashDot',
  'mediumDashDotDot',
  'slantDashDot',
]);

/** RawBorderEdge → BorderEdge に変換する */
export function convertBorderEdge(raw?: RawBorderEdge): BorderEdge | undefined {
  if (!raw || !raw.style) return undefined;
  const style = VALID_BORDER_STYLES.has(raw.style) ? (raw.style as BorderStyle) : 'thin';
  return {
    style,
    color: raw.color ?? '000000',
  };
}

/** 生のボーダー情報 → BoxBorder に変換する */
export function convertBorder(rawBorder?: RawCell['style']['border']): BoxBorder | undefined {
  if (!rawBorder) return undefined;
  const border: BoxBorder = {
    top: convertBorderEdge(rawBorder.top),
    bottom: convertBorderEdge(rawBorder.bottom),
    left: convertBorderEdge(rawBorder.left),
    right: convertBorderEdge(rawBorder.right),
  };
  // 全辺が undefined なら border 自体を返さない
  if (!border.top && !border.bottom && !border.left && !border.right) {
    return undefined;
  }
  return border;
}

/** セルアドレス → RawCell のマップを構築する */
export function buildCellMap(cells: readonly RawCell[]): ReadonlyMap<string, RawCell> {
  const map = new Map<string, RawCell>();
  for (const cell of cells) {
    map.set(cell.address, cell);
  }
  return map;
}

/**
 * 結合範囲の外周セルから罫線情報を収集する。
 *
 * Excel では結合セルの罫線は外周のセルに分散して格納される:
 * - top: 最上行セルの top 罫線
 * - bottom: 最下行セルの bottom 罫線
 * - left: 最左列セルの left 罫線
 * - right: 最右列セルの right 罫線
 */
export function collectMergeBorder(
  merge: MergeInfo,
  cellMap: ReadonlyMap<string, RawCell>,
): BoxBorder | undefined {
  let top: BorderEdge | undefined;
  let bottom: BorderEdge | undefined;
  let left: BorderEdge | undefined;
  let right: BorderEdge | undefined;

  // top: 最上行のセルから top 罫線を探す
  for (let c = merge.startCol; c <= merge.endCol; c++) {
    const addr = columnNumberToLetter(c) + merge.startRow;
    const edge = convertBorderEdge(cellMap.get(addr)?.style.border?.top);
    if (edge) {
      top = edge;
      break;
    }
  }

  // bottom: 最下行のセルから bottom 罫線を探す
  for (let c = merge.startCol; c <= merge.endCol; c++) {
    const addr = columnNumberToLetter(c) + merge.endRow;
    const edge = convertBorderEdge(cellMap.get(addr)?.style.border?.bottom);
    if (edge) {
      bottom = edge;
      break;
    }
  }

  // left: 最左列のセルから left 罫線を探す
  for (let r = merge.startRow; r <= merge.endRow; r++) {
    const addr = columnNumberToLetter(merge.startCol) + r;
    const edge = convertBorderEdge(cellMap.get(addr)?.style.border?.left);
    if (edge) {
      left = edge;
      break;
    }
  }

  // right: 最右列のセルから right 罫線を探す
  for (let r = merge.startRow; r <= merge.endRow; r++) {
    const addr = columnNumberToLetter(merge.endCol) + r;
    const edge = convertBorderEdge(cellMap.get(addr)?.style.border?.right);
    if (edge) {
      right = edge;
      break;
    }
  }

  if (!top && !bottom && !left && !right) return undefined;
  return { top, bottom, left, right };
}
