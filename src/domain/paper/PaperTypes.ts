import type { Size } from '@domain/shared';

/** 用紙サイズ */
export type PaperSize = 'A3' | 'A4' | 'A5';

/** 用紙方向 */
export type Orientation = 'portrait' | 'landscape';

/** Excel余白（インチ単位で保持、制約004） */
export type Margins = {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly header: number;
  readonly footer: number;
};

/** 印刷倍率設定（制約003） */
export type ScalingConfig =
  | { readonly mode: 'scale'; readonly percent: number }
  | {
      readonly mode: 'fitToPage';
      readonly width: number;
      readonly height: number;
    };

/** 用紙定義 */
export type PaperDefinition = {
  readonly size: PaperSize;
  readonly orientation: Orientation;
  readonly margins: Margins;
  readonly scaling: ScalingConfig;
  readonly printableArea: Size;
};

/** 用紙物理寸法（mm、portrait基準） */
export const PAPER_DIMENSIONS: Record<PaperSize, Size> = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
} as const;

/** Excelデフォルト余白（インチ、制約004） */
export const DEFAULT_MARGINS: Margins = {
  top: 1.0,
  bottom: 1.0,
  left: 0.75,
  right: 0.75,
  header: 0.3,
  footer: 0.3,
} as const;

/** 1インチ = 25.4mm */
export const INCHES_TO_MM = 25.4;

/** 1pt = 0.3528mm（制約001） */
export const PT_TO_MM = 0.3528;
