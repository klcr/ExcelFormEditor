import type { Position } from '@domain/shared';

/** 線分スタイル */
export type LineStyle = 'thin' | 'medium' | 'thick' | 'dotted' | 'dashed' | 'double' | 'hair';

/** 線分エンティティ */
export type LineDefinition = {
  readonly id: string;
  readonly start: Position;
  readonly end: Position;
  readonly style: LineStyle;
  readonly color: string;
};
