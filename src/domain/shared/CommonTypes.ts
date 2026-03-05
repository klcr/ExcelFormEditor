/** 位置（mm単位、印刷可能領域の左上を原点） */
export type Position = {
  readonly x: number;
  readonly y: number;
};

/** サイズ（mm単位） */
export type Size = {
  readonly width: number;
  readonly height: number;
};

/** 矩形（位置 + サイズ、mm単位） */
export type Rect = {
  readonly position: Position;
  readonly size: Size;
};
