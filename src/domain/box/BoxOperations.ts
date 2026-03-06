import type { Position, Size } from '@domain/shared';
import { createBox, generateBoxId } from './Box';
import type { BoxDefinition } from './BoxTypes';

/**
 * ボックスを移動する（delta 分だけ平行移動）
 * 新しい BoxDefinition を返す（イミュータブル）
 */
export function moveBox(box: BoxDefinition, delta: Position): BoxDefinition {
  return {
    ...box,
    rect: {
      ...box.rect,
      position: {
        x: box.rect.position.x + delta.x,
        y: box.rect.position.y + delta.y,
      },
    },
  };
}

/**
 * ボックスをリサイズする
 * newSize の width/height は 0 より大きい必要がある
 */
export function resizeBox(box: BoxDefinition, newSize: Size): BoxDefinition {
  if (newSize.width <= 0 || newSize.height <= 0) {
    throw new Error(
      `Invalid size: width and height must be greater than 0 (got width=${newSize.width}, height=${newSize.height})`,
    );
  }
  return {
    ...box,
    rect: {
      ...box.rect,
      size: { width: newSize.width, height: newSize.height },
    },
  };
}

/**
 * ボックスを水平方向に分割する（上下に分割）
 * splitY はボックス上端からの相対位置（mm）
 */
export function splitBoxHorizontal(
  box: BoxDefinition,
  splitY: number,
): [BoxDefinition, BoxDefinition] {
  if (splitY <= 0 || splitY >= box.rect.size.height) {
    throw new Error(
      `splitY must be between 0 and ${box.rect.size.height} exclusive (got ${splitY})`,
    );
  }

  const topBox = createBox({
    id: generateBoxId(),
    rect: {
      position: { ...box.rect.position },
      size: { width: box.rect.size.width, height: splitY },
    },
    content: box.content,
    border: {
      top: box.border.top,
      left: box.border.left,
      right: box.border.right,
    },
    font: { ...box.font },
    fill: box.fill,
    alignment: { ...box.alignment },
  });

  const bottomBox = createBox({
    id: generateBoxId(),
    rect: {
      position: {
        x: box.rect.position.x,
        y: box.rect.position.y + splitY,
      },
      size: {
        width: box.rect.size.width,
        height: box.rect.size.height - splitY,
      },
    },
    content: '',
    border: {
      bottom: box.border.bottom,
      left: box.border.left,
      right: box.border.right,
    },
    font: { ...box.font },
    fill: box.fill,
    alignment: { ...box.alignment },
  });

  return [topBox, bottomBox];
}

/**
 * ボックスを垂直方向に分割する（左右に分割）
 * splitX はボックス左端からの相対位置（mm）
 */
export function splitBoxVertical(
  box: BoxDefinition,
  splitX: number,
): [BoxDefinition, BoxDefinition] {
  if (splitX <= 0 || splitX >= box.rect.size.width) {
    throw new Error(
      `splitX must be between 0 and ${box.rect.size.width} exclusive (got ${splitX})`,
    );
  }

  const leftBox = createBox({
    id: generateBoxId(),
    rect: {
      position: { ...box.rect.position },
      size: { width: splitX, height: box.rect.size.height },
    },
    content: box.content,
    border: {
      top: box.border.top,
      bottom: box.border.bottom,
      left: box.border.left,
    },
    font: { ...box.font },
    fill: box.fill,
    alignment: { ...box.alignment },
  });

  const rightBox = createBox({
    id: generateBoxId(),
    rect: {
      position: {
        x: box.rect.position.x + splitX,
        y: box.rect.position.y,
      },
      size: {
        width: box.rect.size.width - splitX,
        height: box.rect.size.height,
      },
    },
    content: '',
    border: {
      top: box.border.top,
      bottom: box.border.bottom,
      right: box.border.right,
    },
    font: { ...box.font },
    fill: box.fill,
    alignment: { ...box.alignment },
  });

  return [leftBox, rightBox];
}

/**
 * 値を最寄りのグリッドポイントにスナップする
 */
export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) {
    throw new Error(`gridSize must be greater than 0 (got ${gridSize})`);
  }
  return Math.round(value / gridSize) * gridSize;
}

/**
 * 他のボックスのエッジから、threshold 以内のスナップ候補を探す
 * 返り値の x[], y[] はスナップ候補の座標値（重複なし、ソート済み）
 */
export function findNearestSnapPoints(
  box: BoxDefinition,
  others: BoxDefinition[],
  threshold: number,
): { x: number[]; y: number[] } {
  const boxLeft = box.rect.position.x;
  const boxRight = box.rect.position.x + box.rect.size.width;
  const boxTop = box.rect.position.y;
  const boxBottom = box.rect.position.y + box.rect.size.height;

  const boxEdgesX = [boxLeft, boxRight];
  const boxEdgesY = [boxTop, boxBottom];

  const snapXSet = new Set<number>();
  const snapYSet = new Set<number>();

  for (const other of others) {
    if (other.id === box.id) {
      continue;
    }

    const otherLeft = other.rect.position.x;
    const otherRight = other.rect.position.x + other.rect.size.width;
    const otherTop = other.rect.position.y;
    const otherBottom = other.rect.position.y + other.rect.size.height;

    const otherEdgesX = [otherLeft, otherRight];
    const otherEdgesY = [otherTop, otherBottom];

    for (const bx of boxEdgesX) {
      for (const ox of otherEdgesX) {
        if (Math.abs(bx - ox) <= threshold) {
          snapXSet.add(ox);
        }
      }
    }

    for (const by of boxEdgesY) {
      for (const oy of otherEdgesY) {
        if (Math.abs(by - oy) <= threshold) {
          snapYSet.add(oy);
        }
      }
    }
  }

  return {
    x: [...snapXSet].sort((a, b) => a - b),
    y: [...snapYSet].sort((a, b) => a - b),
  };
}
