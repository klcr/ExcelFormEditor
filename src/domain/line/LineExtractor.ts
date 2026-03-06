import type { BorderEdge, BoxDefinition } from '@domain/box';
import { createLine, generateLineId } from './Line';
import type { LineDefinition, LineStyle } from './LineTypes';

/** 線分スタイルの重み（太い方が優先） */
const STYLE_WEIGHT: Record<LineStyle, number> = {
  hair: 1,
  thin: 2,
  dotted: 2,
  dashed: 2,
  medium: 3,
  thick: 4,
  double: 5,
};

/** 座標のキー生成用の精度（小数点以下2桁） */
function roundCoord(v: number): number {
  return Math.round(v * 100) / 100;
}

/** 線分の正規化キー（座標をソートして一意にする） */
function lineKey(x1: number, y1: number, x2: number, y2: number): string {
  const rx1 = roundCoord(x1);
  const ry1 = roundCoord(y1);
  const rx2 = roundCoord(x2);
  const ry2 = roundCoord(y2);

  // 始点が小さい方を先にする（一意性のため）
  if (rx1 < rx2 || (rx1 === rx2 && ry1 < ry2)) {
    return `${rx1},${ry1}-${rx2},${ry2}`;
  }
  return `${rx2},${ry2}-${rx1},${ry1}`;
}

type LineCandidate = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly style: LineStyle;
  readonly color: string;
};

/**
 * ボックスの罫線から線分を抽出し、共有辺を重複排除する。
 *
 * - 各ボックスの border から最大 4 本の線分候補を生成
 * - 同一座標の線分は重複排除し、スタイルの重い方を残す
 */
export function extractLines(boxes: readonly BoxDefinition[]): LineDefinition[] {
  const candidateMap = new Map<string, LineCandidate>();

  for (const box of boxes) {
    const { x, y } = box.rect.position;
    const { width, height } = box.rect.size;

    addCandidate(candidateMap, box.border.top, x, y, x + width, y);
    addCandidate(candidateMap, box.border.bottom, x, y + height, x + width, y + height);
    addCandidate(candidateMap, box.border.left, x, y, x, y + height);
    addCandidate(candidateMap, box.border.right, x + width, y, x + width, y + height);
  }

  const lines: LineDefinition[] = [];
  for (const candidate of candidateMap.values()) {
    lines.push(
      createLine({
        id: generateLineId(),
        start: { x: candidate.x1, y: candidate.y1 },
        end: { x: candidate.x2, y: candidate.y2 },
        style: candidate.style,
        color: candidate.color,
      }),
    );
  }

  return lines;
}

/** 罫線辺から線分候補を追加する（重複時はスタイル重みで判定） */
function addCandidate(
  map: Map<string, LineCandidate>,
  edge: BorderEdge | undefined,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  if (!edge) return;

  const key = lineKey(x1, y1, x2, y2);
  const existing = map.get(key);

  if (existing) {
    // スタイルの重い方を残す
    if (STYLE_WEIGHT[edge.style as LineStyle] > STYLE_WEIGHT[existing.style]) {
      map.set(key, { x1, y1, x2, y2, style: edge.style as LineStyle, color: edge.color });
    }
  } else {
    map.set(key, { x1, y1, x2, y2, style: edge.style as LineStyle, color: edge.color });
  }
}
