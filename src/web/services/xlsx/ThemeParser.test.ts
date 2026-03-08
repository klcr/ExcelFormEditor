import { describe, expect, it } from 'vitest';
import { applyTint, parseThemeColors } from './ThemeParser';

const sampleThemeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="44546A"/></a:dk2>
      <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
  </a:themeElements>
</a:theme>`;

describe('parseThemeColors', () => {
  it('12 色のテーマカラーパレットを抽出する', () => {
    const palette = parseThemeColors(sampleThemeXml);
    expect(palette).toHaveLength(12);
    // index 0 = lt1 (白), index 1 = dk1 (黒)
    expect(palette[0]).toBe('FFFFFF');
    expect(palette[1]).toBe('000000');
    // index 2 = lt2, index 3 = dk2
    expect(palette[2]).toBe('E7E6E6');
    expect(palette[3]).toBe('44546A');
    // accent1-6
    expect(palette[4]).toBe('4472C4');
    expect(palette[5]).toBe('ED7D31');
    expect(palette[6]).toBe('A5A5A5');
    expect(palette[7]).toBe('FFC000');
    expect(palette[8]).toBe('5B9BD5');
    expect(palette[9]).toBe('70AD47');
    // hlink, folHlink
    expect(palette[10]).toBe('0563C1');
    expect(palette[11]).toBe('954F72');
  });

  it('sysClr の lastClr からカラーを取得する', () => {
    const palette = parseThemeColors(sampleThemeXml);
    // dk1 は sysClr lastClr="000000"
    expect(palette[1]).toBe('000000');
  });

  it('不正な XML はデフォルトパレットを返す', () => {
    const palette = parseThemeColors('<invalid/>');
    expect(palette).toHaveLength(12);
  });
});

describe('applyTint', () => {
  it('tint=0 は元の色をそのまま返す', () => {
    expect(applyTint('4472C4', 0)).toBe('4472C4');
  });

  it('tint > 0 で白方向に調整する', () => {
    const result = applyTint('000000', 0.5);
    // 黒 + tint=0.5 → グレー系
    expect(result).not.toBe('000000');
    // R, G, B が均等に増加
    const r = Number.parseInt(result.slice(0, 2), 16);
    expect(r).toBeGreaterThan(0);
  });

  it('tint < 0 で黒方向に調整する', () => {
    const result = applyTint('FFFFFF', -0.5);
    // 白 + tint=-0.5 → グレー系
    expect(result).not.toBe('FFFFFF');
    const r = Number.parseInt(result.slice(0, 2), 16);
    expect(r).toBeLessThan(255);
  });

  it('tint=1.0 で完全な白を返す', () => {
    const result = applyTint('000000', 1.0);
    expect(result).toBe('FFFFFF');
  });

  it('tint=-1.0 で完全な黒を返す', () => {
    const result = applyTint('FFFFFF', -1.0);
    expect(result).toBe('000000');
  });

  it('有彩色に tint を適用する', () => {
    // accent1 (4472C4) に tint=0.4 を適用
    const result = applyTint('4472C4', 0.4);
    // 明るくなるが、色相は維持される
    const r = Number.parseInt(result.slice(0, 2), 16);
    const b = Number.parseInt(result.slice(4, 6), 16);
    expect(r).toBeGreaterThan(0x44);
    expect(b).toBeGreaterThan(0xc4);
  });
});
