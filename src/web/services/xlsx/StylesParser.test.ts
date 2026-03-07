import { describe, expect, it } from 'vitest';
import { parseStyles, resolveStyle } from './StylesParser';

const minimalStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="游ゴシック"/></font>
    <font><b/><i/><sz val="14"/><name val="MS Gothic"/><color rgb="FFFF0000"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FF000000"/></left>
      <right style="medium"><color rgb="FF0000FF"/></right>
      <top style="thick"><color rgb="FFFF0000"/></top>
      <bottom style="double"><color rgb="FF00FF00"/></bottom>
    </border>
  </borders>
  <cellXfs count="3">
    <xf fontId="0" fillId="0" borderId="0"/>
    <xf fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
    <xf fontId="0" fillId="0" borderId="0" applyAlignment="1">
      <alignment horizontal="right"/>
    </xf>
  </cellXfs>
</styleSheet>`;

describe('parseStyles', () => {
  it('フォントを抽出する', () => {
    const styles = parseStyles(minimalStylesXml);
    expect(styles.fonts).toHaveLength(2);
    expect(styles.fonts[0]).toEqual({
      name: '游ゴシック',
      size: 11,
      bold: undefined,
      italic: undefined,
      color: undefined,
    });
    expect(styles.fonts[1]).toEqual({
      name: 'MS Gothic',
      size: 14,
      bold: true,
      italic: true,
      color: 'FF0000',
    });
  });

  it('塗りつぶしを抽出する', () => {
    const styles = parseStyles(minimalStylesXml);
    expect(styles.fills).toHaveLength(3);
    expect(styles.fills[0]).toEqual({});
    expect(styles.fills[1]).toEqual({});
    expect(styles.fills[2]).toEqual({ color: 'FFFF00' });
  });

  it('罫線を抽出する', () => {
    const styles = parseStyles(minimalStylesXml);
    expect(styles.borders).toHaveLength(2);
    expect(styles.borders[0]).toEqual({
      top: undefined,
      bottom: undefined,
      left: undefined,
      right: undefined,
    });
    expect(styles.borders[1]).toEqual({
      left: { style: 'thin', color: '000000' },
      right: { style: 'medium', color: '0000FF' },
      top: { style: 'thick', color: 'FF0000' },
      bottom: { style: 'double', color: '00FF00' },
    });
  });

  it('cellXfs を抽出する', () => {
    const styles = parseStyles(minimalStylesXml);
    expect(styles.cellXfs).toHaveLength(3);
    expect(styles.cellXfs[1]).toEqual({
      fontId: 1,
      fillId: 2,
      borderId: 1,
      numFmtId: 0,
      applyFont: true,
      applyFill: true,
      applyBorder: true,
      applyAlignment: undefined,
      alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
    });
  });

  it('空の styleSheet を処理する', () => {
    const xml = '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"/>';
    const styles = parseStyles(xml);
    expect(styles.fonts).toEqual([]);
    expect(styles.fills).toEqual([]);
    expect(styles.borders).toEqual([]);
    expect(styles.cellXfs).toEqual([]);
  });

  it('テーマカラーを解決する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Arial"/><color theme="1"/></font>
  </fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellXfs>
</styleSheet>`;
    const palette = [
      'FFFFFF',
      '000000',
      'E7E6E6',
      '44546A',
      '4472C4',
      'ED7D31',
      'A5A5A5',
      'FFC000',
      '5B9BD5',
      '70AD47',
      '0563C1',
      '954F72',
    ];
    const styles = parseStyles(xml, palette);
    expect(styles.fonts[0]?.color).toBe('000000');
  });

  it('テーマカラー + tint を解決する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Arial"/><color theme="0" tint="-0.5"/></font>
  </fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellXfs>
</styleSheet>`;
    const palette = [
      'FFFFFF',
      '000000',
      'E7E6E6',
      '44546A',
      '4472C4',
      'ED7D31',
      'A5A5A5',
      'FFC000',
      '5B9BD5',
      '70AD47',
      '0563C1',
      '954F72',
    ];
    const styles = parseStyles(xml, palette);
    // FFFFFF with tint=-0.5 → lum: 1 * (1 + (-0.5)) = 0.5 → gray
    expect(styles.fonts[0]?.color).toBeDefined();
    expect(styles.fonts[0]?.color).not.toBe('FFFFFF');
  });

  it('インデックスカラーを解決する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Arial"/><color indexed="2"/></font>
  </fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellXfs>
</styleSheet>`;
    const styles = parseStyles(xml);
    expect(styles.fonts[0]?.color).toBe('FF0000'); // indexed 2 = red
  });

  it('テーマパレット未指定時はテーマカラーを無視する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Arial"/><color theme="4"/></font>
  </fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellXfs>
</styleSheet>`;
    const styles = parseStyles(xml);
    expect(styles.fonts[0]?.color).toBeUndefined();
  });

  it('numFmts をパースする', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="yyyy/mm/dd"/>
    <numFmt numFmtId="165" formatCode="#,##0.00"/>
  </numFmts>
  <fonts count="1"><font><sz val="11"/><name val="Arial"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellXfs>
</styleSheet>`;
    const styles = parseStyles(xml);
    expect(styles.numFmts.get(164)).toBe('yyyy/mm/dd');
    expect(styles.numFmts.get(165)).toBe('#,##0.00');
  });

  it('numFmtId を cellXfs から抽出する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Arial"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0" numFmtId="14"/></cellXfs>
</styleSheet>`;
    const styles = parseStyles(xml);
    expect(styles.cellXfs[0]?.numFmtId).toBe(14);
  });
});

describe('resolveStyle', () => {
  const styles = parseStyles(minimalStylesXml);

  it('スタイルインデックス 0: デフォルトスタイル', () => {
    const result = resolveStyle(0, styles);
    expect(result.font).toEqual({
      name: '游ゴシック',
      size: 11,
      bold: undefined,
      italic: undefined,
      color: undefined,
    });
    expect(result.fill).toBeUndefined();
    expect(result.border).toBeUndefined();
  });

  it('スタイルインデックス 1: フル装飾', () => {
    const result = resolveStyle(1, styles);
    expect(result.font).toEqual({
      name: 'MS Gothic',
      size: 14,
      bold: true,
      italic: true,
      color: 'FF0000',
    });
    expect(result.fill).toEqual({ color: 'FFFF00' });
    expect(result.border).toEqual({
      left: { style: 'thin', color: '000000' },
      right: { style: 'medium', color: '0000FF' },
      top: { style: 'thick', color: 'FF0000' },
      bottom: { style: 'double', color: '00FF00' },
    });
    expect(result.alignment).toEqual({
      horizontal: 'center',
      vertical: 'top',
      wrapText: true,
    });
  });

  it('スタイルインデックス 2: alignment のみ', () => {
    const result = resolveStyle(2, styles);
    expect(result.alignment).toEqual({ horizontal: 'right' });
  });

  it('範囲外インデックスは空スタイル', () => {
    const result = resolveStyle(99, styles);
    expect(result).toEqual({});
  });
});
