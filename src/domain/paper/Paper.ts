import type { Size } from '@domain/shared';
import {
  DEFAULT_MARGINS,
  INCHES_TO_MM,
  type Margins,
  type Orientation,
  PAPER_DIMENSIONS,
  type PaperDefinition,
  type PaperSize,
  type ScalingConfig,
} from './PaperTypes';

/**
 * 用紙の物理寸法を取得する。landscape の場合は幅と高さを入れ替える。
 */
export function getPaperDimensions(size: PaperSize, orientation: Orientation): Size {
  const dim = PAPER_DIMENSIONS[size];
  if (orientation === 'landscape') {
    return { width: dim.height, height: dim.width };
  }
  return dim;
}

/**
 * 印刷可能領域を算出する（制約002）。
 * printableWidth  = paperWidth  - (marginLeft + marginRight) × 25.4
 * printableHeight = paperHeight - (marginTop + marginBottom) × 25.4
 */
export function calculatePrintableArea(
  size: PaperSize,
  orientation: Orientation,
  margins: Margins,
): Size {
  const paper = getPaperDimensions(size, orientation);
  const width = paper.width - (margins.left + margins.right) * INCHES_TO_MM;
  const height = paper.height - (margins.top + margins.bottom) * INCHES_TO_MM;
  return { width, height };
}

/**
 * 余白をバリデーションする（制約004）。
 * - 負の値 → そのフィールドのみデフォルトにフォールバック
 * - 印刷可能領域が 0 以下 → エラー
 */
export function validateMargins(
  margins: Partial<Margins>,
  size: PaperSize,
  orientation: Orientation,
): { ok: true; margins: Margins } | { ok: false; error: string } {
  const resolved: Margins = {
    top: sanitizeMargin(margins.top, DEFAULT_MARGINS.top),
    bottom: sanitizeMargin(margins.bottom, DEFAULT_MARGINS.bottom),
    left: sanitizeMargin(margins.left, DEFAULT_MARGINS.left),
    right: sanitizeMargin(margins.right, DEFAULT_MARGINS.right),
    header: sanitizeMargin(margins.header, DEFAULT_MARGINS.header),
    footer: sanitizeMargin(margins.footer, DEFAULT_MARGINS.footer),
  };

  const printable = calculatePrintableArea(size, orientation, resolved);
  if (printable.width <= 0 || printable.height <= 0) {
    return {
      ok: false,
      error: `印刷可能領域が正でありません (width: ${printable.width.toFixed(1)}mm, height: ${printable.height.toFixed(1)}mm)`,
    };
  }

  return { ok: true, margins: resolved };
}

function sanitizeMargin(value: number | undefined, defaultValue: number): number {
  if (value === undefined || value < 0) {
    return defaultValue;
  }
  return value;
}

/** createPaperDefinition のパラメータ */
export type CreatePaperParams = {
  readonly size: PaperSize;
  readonly orientation: Orientation;
  readonly margins?: Partial<Margins>;
  readonly scaling?: ScalingConfig;
};

/**
 * PaperDefinition を生成するファクトリ関数。
 * 余白バリデーション込み。デフォルト scaling は scale 100%。
 */
export function createPaperDefinition(
  params: CreatePaperParams,
): { ok: true; paper: PaperDefinition } | { ok: false; error: string } {
  const validation = validateMargins(params.margins ?? {}, params.size, params.orientation);
  if (!validation.ok) {
    return validation;
  }

  const scaling: ScalingConfig = params.scaling ?? {
    mode: 'scale',
    percent: 100,
  };
  const printableArea = calculatePrintableArea(params.size, params.orientation, validation.margins);

  return {
    ok: true,
    paper: {
      size: params.size,
      orientation: params.orientation,
      margins: validation.margins,
      scaling,
      printableArea,
    },
  };
}
