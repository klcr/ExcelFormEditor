import type { Size } from '@domain/shared';
import type { ScalingConfig } from './PaperTypes';
import { INCHES_TO_MM, PT_TO_MM } from './PaperTypes';

/** ポイントをmmに変換する。1pt = 0.3528mm（制約001） */
export function ptToMm(pt: number): number {
  return pt * PT_TO_MM;
}

/** インチをmmに変換する。1in = 25.4mm */
export function inchesToMm(inches: number): number {
  return inches * INCHES_TO_MM;
}

/**
 * Excel列幅（文字数単位）をmmに変換する。
 *
 * Calibri 11pt / 96DPI の標準近似:
 *   pixelWidth = charUnits × 7 + 5
 *   mm = pixelWidth × 25.4 / 96
 */
export function excelColumnWidthToMm(charUnits: number): number {
  if (charUnits <= 0) {
    return 0;
  }
  const pixelWidth = charUnits * 7 + 5;
  return (pixelWidth * INCHES_TO_MM) / 96;
}

const SCALE_MIN = 10;
const SCALE_MAX = 400;
const EFFECTIVE_SCALE_MIN = 0.1;
const EFFECTIVE_SCALE_MAX = 4.0;

/**
 * ScalingConfig から実効倍率を算出する（制約003）。
 *
 * scale モード: effectiveScale = percent / 100
 *   - percent が範囲外 (< 10 or > 400 or 0) → 1.0
 *
 * fitToPage モード: effectiveScale = min(scaleW, scaleH)
 *   - width=0 & height=0 → 1.0（フォールバック）
 *   - contentSize 未指定 → 1.0
 *   - 算出値を [0.1, 4.0] にクランプ
 */
export function calculateEffectiveScale(
  scaling: ScalingConfig,
  printableArea: Size,
  contentSize?: Size,
): number {
  if (scaling.mode === 'scale') {
    return calculateScaleMode(scaling.percent);
  }
  return calculateFitToPageMode(scaling.width, scaling.height, printableArea, contentSize);
}

function calculateScaleMode(percent: number): number {
  if (percent <= 0 || percent < SCALE_MIN || percent > SCALE_MAX) {
    return 1.0;
  }
  return percent / 100;
}

function calculateFitToPageMode(
  fitWidth: number,
  fitHeight: number,
  printableArea: Size,
  contentSize?: Size,
): number {
  if (fitWidth === 0 && fitHeight === 0) {
    return 1.0;
  }
  if (!contentSize || contentSize.width <= 0 || contentSize.height <= 0) {
    return 1.0;
  }

  const scales: number[] = [];
  if (fitWidth > 0) {
    scales.push(printableArea.width / contentSize.width);
  }
  if (fitHeight > 0) {
    scales.push(printableArea.height / contentSize.height);
  }

  if (scales.length === 0) {
    return 1.0;
  }

  const raw = Math.min(...scales);
  return clamp(raw, EFFECTIVE_SCALE_MIN, EFFECTIVE_SCALE_MAX);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 値に実効倍率を適用する（制約003） */
export function applyScale(value: number, effectiveScale: number): number {
  return value * effectiveScale;
}

/** Size に実効倍率を適用する */
export function applyScaleToSize(size: Size, effectiveScale: number): Size {
  return {
    width: size.width * effectiveScale,
    height: size.height * effectiveScale,
  };
}
