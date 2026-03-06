import { createBox, generateBoxId } from './Box';
import type { BoxBorder, BoxDefinition } from './BoxTypes';

/** マージ可否の判定結果 */
export type MergeValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string };

/**
 * 選択されたボックス群が矩形にマージ可能か判定する
 * - 2つ以上のボックスが必要
 * - ボックス群の面積合計 === バウンディングボックスの面積（矩形タイル条件）
 * - ボックス同士が重ならない
 */
export function validateMerge(boxes: readonly BoxDefinition[]): MergeValidation {
  if (boxes.length < 2) {
    return { valid: false, reason: 'マージには2つ以上のボックスが必要です' };
  }

  // バウンディングボックス計算
  const bounds = computeBoundingBox(boxes);

  // 面積合計 vs バウンディングボックス面積
  const totalArea = boxes.reduce((sum, b) => sum + b.rect.size.width * b.rect.size.height, 0);
  const boundsArea = bounds.width * bounds.height;

  // 浮動小数点誤差を考慮
  if (Math.abs(totalArea - boundsArea) > 0.001) {
    return {
      valid: false,
      reason: 'ボックス群がバウンディングボックスを隙間なく埋めていません',
    };
  }

  // 重なりチェック
  if (hasOverlap(boxes)) {
    return { valid: false, reason: 'ボックス同士が重なっています' };
  }

  return { valid: true };
}

/**
 * 複数のボックスを1つに結合する
 * - validateMerge が valid でない場合はエラーを投げる
 * - 結果のボックスはバウンディングボックスの rect を持つ
 * - content/font/fill/alignment: 左上のボックスから継承
 * - border: 外周のボーダーのみ保持
 */
export function mergeBoxes(boxes: readonly BoxDefinition[]): BoxDefinition {
  const validation = validateMerge(boxes);
  if (!validation.valid) {
    throw new Error(`マージ不可: ${validation.reason}`);
  }

  const primary = findPrimaryBox(boxes);
  const bounds = computeBoundingBox(boxes);
  const border = computeOuterBorder(boxes, bounds);

  return createBox({
    id: generateBoxId(),
    rect: {
      position: { x: bounds.x, y: bounds.y },
      size: { width: bounds.width, height: bounds.height },
    },
    content: primary.content,
    border,
    font: { ...primary.font },
    fill: primary.fill,
    alignment: { ...primary.alignment },
  });
}

type BoundingBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

function computeBoundingBox(boxes: readonly BoxDefinition[]): BoundingBox {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const box of boxes) {
    const { x, y } = box.rect.position;
    const { width, height } = box.rect.size;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** 重なりチェック（O(n^2) だが n は小さい） */
function hasOverlap(boxes: readonly BoxDefinition[]): boolean {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i] as BoxDefinition;
      const b = boxes[j] as BoxDefinition;
      if (rectsOverlap(a, b)) return true;
    }
  }
  return false;
}

function rectsOverlap(a: BoxDefinition, b: BoxDefinition): boolean {
  const aLeft = a.rect.position.x;
  const aRight = aLeft + a.rect.size.width;
  const aTop = a.rect.position.y;
  const aBottom = aTop + a.rect.size.height;

  const bLeft = b.rect.position.x;
  const bRight = bLeft + b.rect.size.width;
  const bTop = b.rect.position.y;
  const bBottom = bTop + b.rect.size.height;

  // 重なりなし条件の否定
  return !(aRight <= bLeft || bRight <= aLeft || aBottom <= bTop || bBottom <= aTop);
}

/** 左上のボックスを見つける（y昇順 → x昇順） */
function findPrimaryBox(boxes: readonly BoxDefinition[]): BoxDefinition {
  const sorted = [...boxes].sort((a, b) => {
    const dy = a.rect.position.y - b.rect.position.y;
    if (Math.abs(dy) > 0.001) return dy;
    return a.rect.position.x - b.rect.position.x;
  });
  return sorted[0] as BoxDefinition;
}

/** 外周のボーダーを収集する */
function computeOuterBorder(boxes: readonly BoxDefinition[], bounds: BoundingBox): BoxBorder {
  const topEdge = bounds.y;
  const bottomEdge = bounds.y + bounds.height;
  const leftEdge = bounds.x;
  const rightEdge = bounds.x + bounds.width;

  let top: BoxBorder['top'];
  let bottom: BoxBorder['bottom'];
  let left: BoxBorder['left'];
  let right: BoxBorder['right'];

  for (const box of boxes) {
    const bx = box.rect.position.x;
    const by = box.rect.position.y;
    const bRight = bx + box.rect.size.width;
    const bBottom = by + box.rect.size.height;

    if (Math.abs(by - topEdge) < 0.001 && box.border.top && !top) {
      top = box.border.top;
    }
    if (Math.abs(bBottom - bottomEdge) < 0.001 && box.border.bottom && !bottom) {
      bottom = box.border.bottom;
    }
    if (Math.abs(bx - leftEdge) < 0.001 && box.border.left && !left) {
      left = box.border.left;
    }
    if (Math.abs(bRight - rightEdge) < 0.001 && box.border.right && !right) {
      right = box.border.right;
    }
  }

  return { top, bottom, left, right };
}
