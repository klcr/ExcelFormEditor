import { describe, expect, it } from 'vitest';
import {
  applyScale,
  applyScaleToSize,
  calculateEffectiveScale,
  excelColumnWidthToMm,
  inchesToMm,
  ptToMm,
} from './CoordinateConverter';

describe('ptToMm', () => {
  it('1pt = 0.3528mm', () => {
    expect(ptToMm(1)).toBeCloseTo(0.3528, 4);
  });

  it('12pt = 4.2336mm（標準フォントサイズ）', () => {
    expect(ptToMm(12)).toBeCloseTo(4.2336, 4);
  });

  it('0pt = 0mm', () => {
    expect(ptToMm(0)).toBe(0);
  });

  it('負の値もそのまま変換される', () => {
    expect(ptToMm(-10)).toBeCloseTo(-3.528, 4);
  });
});

describe('inchesToMm', () => {
  it('1in = 25.4mm', () => {
    expect(inchesToMm(1)).toBeCloseTo(25.4, 4);
  });

  it('0.75in = 19.05mm', () => {
    expect(inchesToMm(0.75)).toBeCloseTo(19.05, 4);
  });

  it('0in = 0mm', () => {
    expect(inchesToMm(0)).toBe(0);
  });
});

describe('excelColumnWidthToMm', () => {
  it('Excel デフォルト列幅 8.43 文字で妥当な値を返す', () => {
    // (8.43 * 7 + 5) * 25.4 / 96 ≈ 16.93mm
    const result = excelColumnWidthToMm(8.43);
    expect(result).toBeGreaterThan(15);
    expect(result).toBeLessThan(20);
  });

  it('0 以下は 0mm を返す', () => {
    expect(excelColumnWidthToMm(0)).toBe(0);
    expect(excelColumnWidthToMm(-1)).toBe(0);
  });

  it('1 文字幅の変換', () => {
    // (1 * 7 + 5) * 25.4 / 96 ≈ 3.175mm
    const result = excelColumnWidthToMm(1);
    expect(result).toBeCloseTo(3.175, 2);
  });
});

describe('calculateEffectiveScale — scale モード', () => {
  const printable = { width: 200, height: 300 };

  it('100% → 1.0', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 100 }, printable)).toBe(1.0);
  });

  it('80% → 0.8', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 80 }, printable)).toBeCloseTo(0.8, 4);
  });

  it('150% → 1.5', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 150 }, printable)).toBeCloseTo(1.5, 4);
  });

  it('0% → 1.0（フォールバック）', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 0 }, printable)).toBe(1.0);
  });

  it('5% → 1.0（範囲外）', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 5 }, printable)).toBe(1.0);
  });

  it('500% → 1.0（範囲外）', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 500 }, printable)).toBe(1.0);
  });

  it('10% → 0.1（下限境界値）', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 10 }, printable)).toBeCloseTo(0.1, 4);
  });

  it('400% → 4.0（上限境界値）', () => {
    expect(calculateEffectiveScale({ mode: 'scale', percent: 400 }, printable)).toBeCloseTo(4.0, 4);
  });
});

describe('calculateEffectiveScale — fitToPage モード', () => {
  const printable = { width: 200, height: 300 };

  it('width=1, height=1 で両方向の最小値', () => {
    const content = { width: 400, height: 600 };
    const result = calculateEffectiveScale(
      { mode: 'fitToPage', width: 1, height: 1 },
      printable,
      content,
    );
    // min(200/400, 300/600) = min(0.5, 0.5) = 0.5
    expect(result).toBeCloseTo(0.5, 4);
  });

  it('width=1, height=0 で横幅のみ', () => {
    const content = { width: 400, height: 600 };
    const result = calculateEffectiveScale(
      { mode: 'fitToPage', width: 1, height: 0 },
      printable,
      content,
    );
    // 200/400 = 0.5
    expect(result).toBeCloseTo(0.5, 4);
  });

  it('width=0, height=1 で縦幅のみ', () => {
    const content = { width: 400, height: 600 };
    const result = calculateEffectiveScale(
      { mode: 'fitToPage', width: 0, height: 1 },
      printable,
      content,
    );
    // 300/600 = 0.5
    expect(result).toBeCloseTo(0.5, 4);
  });

  it('width=0, height=0 → 1.0（フォールバック）', () => {
    const content = { width: 400, height: 600 };
    const result = calculateEffectiveScale(
      { mode: 'fitToPage', width: 0, height: 0 },
      printable,
      content,
    );
    expect(result).toBe(1.0);
  });

  it('contentSize 未指定 → 1.0', () => {
    const result = calculateEffectiveScale({ mode: 'fitToPage', width: 1, height: 1 }, printable);
    expect(result).toBe(1.0);
  });

  it('算出値が 0.1 未満の場合クランプ', () => {
    const content = { width: 10000, height: 10000 };
    const result = calculateEffectiveScale(
      { mode: 'fitToPage', width: 1, height: 1 },
      printable,
      content,
    );
    // min(200/10000, 300/10000) = 0.02 → clamp to 0.1
    expect(result).toBe(0.1);
  });

  it('算出値が 4.0 超過の場合クランプ', () => {
    const content = { width: 10, height: 10 };
    const result = calculateEffectiveScale(
      { mode: 'fitToPage', width: 1, height: 1 },
      printable,
      content,
    );
    // min(200/10, 300/10) = 20 → clamp to 4.0
    expect(result).toBe(4.0);
  });

  it('contentSize の width が 0 以下 → 1.0', () => {
    const result = calculateEffectiveScale({ mode: 'fitToPage', width: 1, height: 1 }, printable, {
      width: 0,
      height: 300,
    });
    expect(result).toBe(1.0);
  });
});

describe('applyScale', () => {
  it('100 × 0.8 = 80', () => {
    expect(applyScale(100, 0.8)).toBe(80);
  });

  it('50 × 1.5 = 75', () => {
    expect(applyScale(50, 1.5)).toBe(75);
  });

  it('0 × any = 0', () => {
    expect(applyScale(0, 2.0)).toBe(0);
  });
});

describe('applyScaleToSize', () => {
  it('幅と高さの両方にスケールが適用される', () => {
    const result = applyScaleToSize({ width: 100, height: 200 }, 0.5);
    expect(result).toEqual({ width: 50, height: 100 });
  });
});
