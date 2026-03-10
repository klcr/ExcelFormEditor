import type { Rect } from '@domain/shared';

/** 罫線スタイル */
export type BorderStyle =
  | 'thin'
  | 'medium'
  | 'thick'
  | 'dotted'
  | 'dashed'
  | 'double'
  | 'hair'
  | 'dashDot'
  | 'dashDotDot'
  | 'mediumDashed'
  | 'mediumDashDot'
  | 'mediumDashDotDot'
  | 'slantDashDot';

/** 罫線の1辺 */
export type BorderEdge = {
  readonly style: BorderStyle;
  readonly color: string;
};

/** ボックスの4辺罫線 */
export type BoxBorder = {
  readonly top?: BorderEdge;
  readonly bottom?: BorderEdge;
  readonly left?: BorderEdge;
  readonly right?: BorderEdge;
};

/** フォント情報 */
export type BoxFont = {
  readonly name: string;
  readonly sizePt: number;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly color: string;
  /** 下線種別（single, double, singleAccounting, doubleAccounting） */
  readonly underline?: string;
  /** 取消線 */
  readonly strikethrough?: boolean;
};

/** 塗りつぶし */
export type BoxFill = {
  readonly color: string;
};

/** 水平配置 */
export type HorizontalAlignment = 'left' | 'center' | 'right' | 'justify' | 'distributed';

/** 垂直配置 */
export type VerticalAlignment = 'top' | 'middle' | 'bottom' | 'justify' | 'distributed';

/** テキスト配置 */
export type BoxAlignment = {
  readonly horizontal: HorizontalAlignment;
  readonly vertical: VerticalAlignment;
  readonly wrapText: boolean;
  /** テキスト回転角度（0-180度、255=縦書き） */
  readonly textRotation?: number;
  /** セル幅に合わせて縮小 */
  readonly shrinkToFit?: boolean;
};

/** 余白（mm 単位） */
export type BoxPadding = {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

/** ボックスエンティティ */
export type BoxDefinition = {
  readonly id: string;
  readonly rect: Rect;
  readonly content: string;
  readonly border: BoxBorder;
  readonly font: BoxFont;
  readonly fill?: BoxFill;
  readonly alignment: BoxAlignment;
  readonly padding?: BoxPadding;
};
