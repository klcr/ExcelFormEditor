import { describe, expect, it } from 'vitest';
import {
  calculatePrintableArea,
  createPaperDefinition,
  getPaperDimensions,
  validateMargins,
} from './Paper';
import { DEFAULT_MARGINS } from './PaperTypes';

describe('getPaperDimensions', () => {
  it('A4 portrait は 210×297mm', () => {
    const dim = getPaperDimensions('A4', 'portrait');
    expect(dim).toEqual({ width: 210, height: 297 });
  });

  it('A4 landscape は 297×210mm', () => {
    const dim = getPaperDimensions('A4', 'landscape');
    expect(dim).toEqual({ width: 297, height: 210 });
  });

  it('A3 portrait は 297×420mm', () => {
    const dim = getPaperDimensions('A3', 'portrait');
    expect(dim).toEqual({ width: 297, height: 420 });
  });

  it('A5 landscape は 210×148mm', () => {
    const dim = getPaperDimensions('A5', 'landscape');
    expect(dim).toEqual({ width: 210, height: 148 });
  });
});

describe('calculatePrintableArea', () => {
  it('A4 portrait + デフォルト余白 → 171.9×246.2mm', () => {
    const area = calculatePrintableArea('A4', 'portrait', DEFAULT_MARGINS);
    expect(area.width).toBeCloseTo(171.9, 1);
    expect(area.height).toBeCloseTo(246.2, 1);
  });

  it('A3 portrait + デフォルト余白', () => {
    const area = calculatePrintableArea('A3', 'portrait', DEFAULT_MARGINS);
    // 297 - (0.75 + 0.75) * 25.4 = 258.9
    expect(area.width).toBeCloseTo(258.9, 1);
    // 420 - (1.0 + 1.0) * 25.4 = 369.2
    expect(area.height).toBeCloseTo(369.2, 1);
  });

  it('A4 landscape + デフォルト余白', () => {
    const area = calculatePrintableArea('A4', 'landscape', DEFAULT_MARGINS);
    // 297 - (0.75 + 0.75) * 25.4 = 258.9
    expect(area.width).toBeCloseTo(258.9, 1);
    // 210 - (1.0 + 1.0) * 25.4 = 159.2
    expect(area.height).toBeCloseTo(159.2, 1);
  });

  it('カスタム余白で算出できる', () => {
    const margins = {
      top: 0.5,
      bottom: 0.5,
      left: 0.5,
      right: 0.5,
      header: 0.3,
      footer: 0.3,
    };
    const area = calculatePrintableArea('A4', 'portrait', margins);
    // 210 - (0.5 + 0.5) * 25.4 = 184.6
    expect(area.width).toBeCloseTo(184.6, 1);
    // 297 - (0.5 + 0.5) * 25.4 = 271.6
    expect(area.height).toBeCloseTo(271.6, 1);
  });
});

describe('validateMargins', () => {
  it('全て有効な余白はそのまま通過する', () => {
    const result = validateMargins(DEFAULT_MARGINS, 'A4', 'portrait');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.margins).toEqual(DEFAULT_MARGINS);
    }
  });

  it('負の余白はデフォルトに置換される', () => {
    const result = validateMargins(
      { top: -1, bottom: 1.0, left: 0.75, right: 0.75, header: 0.3, footer: 0.3 },
      'A4',
      'portrait',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.margins.top).toBe(DEFAULT_MARGINS.top);
    }
  });

  it('未指定のフィールドはデフォルトが適用される', () => {
    const result = validateMargins({}, 'A4', 'portrait');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.margins).toEqual(DEFAULT_MARGINS);
    }
  });

  it('部分的な指定では欠落分のみデフォルトが適用される', () => {
    const result = validateMargins({ top: 0.5, left: 0.5 }, 'A4', 'portrait');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.margins.top).toBe(0.5);
      expect(result.margins.left).toBe(0.5);
      expect(result.margins.bottom).toBe(DEFAULT_MARGINS.bottom);
      expect(result.margins.right).toBe(DEFAULT_MARGINS.right);
    }
  });

  it('印刷可能領域が 0 以下の場合はエラー', () => {
    const result = validateMargins({ left: 5, right: 5 }, 'A4', 'portrait');
    // (5 + 5) * 25.4 = 254 > 210mm → printable width < 0
    expect(result.ok).toBe(false);
  });

  it('0 の余白は有効値として扱う', () => {
    const result = validateMargins(
      { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 },
      'A4',
      'portrait',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.margins.top).toBe(0);
      expect(result.margins.left).toBe(0);
    }
  });
});

describe('createPaperDefinition', () => {
  it('最小パラメータでデフォルト値が適用される', () => {
    const result = createPaperDefinition({
      size: 'A4',
      orientation: 'portrait',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paper.size).toBe('A4');
      expect(result.paper.orientation).toBe('portrait');
      expect(result.paper.margins).toEqual(DEFAULT_MARGINS);
      expect(result.paper.scaling).toEqual({ mode: 'scale', percent: 100 });
      expect(result.paper.printableArea.width).toBeCloseTo(171.9, 1);
      expect(result.paper.printableArea.height).toBeCloseTo(246.2, 1);
    }
  });

  it('全パラメータ指定で正確な値が返る', () => {
    const result = createPaperDefinition({
      size: 'A3',
      orientation: 'landscape',
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 1.0,
        right: 1.0,
        header: 0.3,
        footer: 0.3,
      },
      scaling: { mode: 'fitToPage', width: 1, height: 1 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paper.size).toBe('A3');
      expect(result.paper.orientation).toBe('landscape');
      expect(result.paper.scaling).toEqual({
        mode: 'fitToPage',
        width: 1,
        height: 1,
      });
    }
  });

  it('無効な余白の場合はエラーを返す', () => {
    const result = createPaperDefinition({
      size: 'A5',
      orientation: 'portrait',
      margins: { left: 10, right: 10 },
    });
    expect(result.ok).toBe(false);
  });
});
