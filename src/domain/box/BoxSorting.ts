import type { BoxDefinition } from './BoxTypes';

/** 同一行とみなす y 座標の許容差（mm） */
const ROW_TOLERANCE_MM = 2;

/**
 * ボックスを読み順（上→下、左→右）でソートする。
 * y 座標が ROW_TOLERANCE_MM 以内のボックスは同一行とみなす。
 */
export function sortBoxesByPosition(boxes: readonly BoxDefinition[]): BoxDefinition[] {
  return [...boxes].sort((a, b) => {
    const ay = a.rect.position.y;
    const by = b.rect.position.y;

    // y 座標が近いボックスは同一行
    if (Math.abs(ay - by) <= ROW_TOLERANCE_MM) {
      return a.rect.position.x - b.rect.position.x;
    }

    return ay - by;
  });
}
