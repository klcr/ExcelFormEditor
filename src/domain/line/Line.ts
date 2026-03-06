import type { Position } from '@domain/shared';
import type { LineDefinition, LineStyle } from './LineTypes';

/** createLine のパラメータ */
export type CreateLineParams = {
  readonly id: string;
  readonly start: Position;
  readonly end: Position;
  readonly style?: LineStyle;
  readonly color?: string;
};

/** LineDefinition を生成するファクトリ関数 */
export function createLine(params: CreateLineParams): LineDefinition {
  return {
    id: params.id,
    start: params.start,
    end: params.end,
    style: params.style ?? 'thin',
    color: params.color ?? '000000',
  };
}

let lineCounter = 0;

/** 一意な Line ID を生成する */
export function generateLineId(): string {
  lineCounter++;
  return `line-${lineCounter}`;
}

/** Line ID カウンターをリセットする（テスト用） */
export function resetLineIdCounter(): void {
  lineCounter = 0;
}
