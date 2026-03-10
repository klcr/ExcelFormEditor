import { describe, expect, it } from 'vitest';
import { createBox } from './Box';
import { generateBoxCss } from './CssGenerator';

describe('generateBoxCss', () => {
  it('全プロパティを持つボックスのCSSを正しく生成する', () => {
    const box = createBox({
      id: 'test-full',
      rect: { position: { x: 10, y: 20 }, size: { width: 100, height: 30 } },
      content: 'テスト',
      border: {
        top: { style: 'thin', color: '000000' },
        bottom: { style: 'medium', color: 'FF0000' },
        left: { style: 'dashed', color: '00FF00' },
        right: { style: 'thick', color: '0000FF' },
      },
      font: {
        name: 'MS Gothic',
        sizePt: 14,
        bold: true,
        italic: true,
        color: '333333',
      },
      fill: { color: 'FFFF00' },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    });

    const css = generateBoxCss(box);

    // Position and size
    expect(css).toContain('position: absolute;');
    expect(css).toContain('left: 10mm;');
    expect(css).toContain('top: 20mm;');
    expect(css).toContain('width: 100mm;');
    expect(css).toContain('height: 30mm;');

    // Borders
    expect(css).toContain('border-top: 0.3mm solid #000000;');
    expect(css).toContain('border-bottom: 0.7mm solid #FF0000;');
    expect(css).toContain('border-left: 0.3mm dashed #00FF00;');
    expect(css).toContain('border-right: 1.2mm solid #0000FF;');

    // Font
    expect(css).toContain("font-family: 'MS Gothic';");
    expect(css).toContain('font-size: 4.94mm;'); // 14 * 0.353 = 4.942 → 4.94
    expect(css).toContain('font-weight: bold;');
    expect(css).toContain('font-style: italic;');
    expect(css).toContain('color: #333333;');

    // Fill
    expect(css).toContain('background-color: #FFFF00;');

    // Alignment
    expect(css).toContain('align-items: center;');
    expect(css).toContain('text-align: center;');

    // Wrap
    expect(css).toContain('word-wrap: break-word;');

    // Box sizing
    expect(css).toContain('box-sizing: border-box;');
  });

  it('オプショナルプロパティが未設定の場合は対応するCSSを出力しない', () => {
    const box = createBox({
      id: 'test-minimal',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
    });

    const css = generateBoxCss(box);

    // Position and size are always present
    expect(css).toContain('position: absolute;');
    expect(css).toContain('left: 0mm;');
    expect(css).toContain('top: 0mm;');

    // No borders
    expect(css).not.toContain('border-top:');
    expect(css).not.toContain('border-bottom:');
    expect(css).not.toContain('border-left:');
    expect(css).not.toContain('border-right:');

    // No fill
    expect(css).not.toContain('background-color:');

    // No bold/italic for defaults
    expect(css).not.toContain('font-weight: bold;');
    expect(css).not.toContain('font-style: italic;');

    // No word-wrap (default is false)
    expect(css).not.toContain('word-wrap:');
  });

  it('pt → mm 変換が正しく行われる', () => {
    const box = createBox({
      id: 'test-conversion',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      font: { sizePt: 11 },
    });

    const css = generateBoxCss(box);
    // 11pt * 0.353 = 3.883 → 3.88
    expect(css).toContain('font-size: 3.88mm;');
  });

  it('各BorderStyleが正しいCSSスタイルにマッピングされる', () => {
    const borderStyles = [
      { style: 'thin' as const, expectedStyle: 'solid', expectedWidth: '0.3mm' },
      { style: 'hair' as const, expectedStyle: 'solid', expectedWidth: '0.1mm' },
      { style: 'medium' as const, expectedStyle: 'solid', expectedWidth: '0.7mm' },
      { style: 'thick' as const, expectedStyle: 'solid', expectedWidth: '1.2mm' },
      { style: 'dotted' as const, expectedStyle: 'dotted', expectedWidth: '0.3mm' },
      { style: 'dashed' as const, expectedStyle: 'dashed', expectedWidth: '0.3mm' },
      { style: 'double' as const, expectedStyle: 'double', expectedWidth: '0.7mm' },
    ];

    for (const { style, expectedStyle, expectedWidth } of borderStyles) {
      const box = createBox({
        id: `test-border-${style}`,
        rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
        border: { top: { style, color: '000000' } },
      });

      const css = generateBoxCss(box);
      expect(css).toContain(`border-top: ${expectedWidth} ${expectedStyle} #000000;`);
    }
  });

  it('#付きの色文字列をそのまま扱う', () => {
    const box = createBox({
      id: 'test-hash-color',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      font: { color: '#FF0000' },
      fill: { color: '#00FF00' },
    });

    const css = generateBoxCss(box);
    expect(css).toContain('color: #FF0000;');
    expect(css).toContain('background-color: #00FF00;');
  });

  it('paddingが設定されている場合にCSS paddingを出力する', () => {
    const box = createBox({
      id: 'test-padding',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      padding: { top: 2, right: 3, bottom: 4, left: 5 },
    });

    const css = generateBoxCss(box);
    expect(css).toContain('padding: 2mm 3mm 4mm 5mm;');
  });

  it('padding全辺同値の場合はショートハンドで出力する', () => {
    const box = createBox({
      id: 'test-padding-uniform',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
    });

    const css = generateBoxCss(box);
    expect(css).toContain('padding: 1mm;');
    expect(css).not.toContain('padding: 1mm 1mm 1mm 1mm;');
  });

  it('paddingが未設定の場合はCSS paddingを出力しない', () => {
    const box = createBox({
      id: 'test-no-padding',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
    });

    const css = generateBoxCss(box);
    expect(css).not.toContain('padding:');
  });

  it('垂直配置が正しくマッピングされる', () => {
    const alignments = [
      { vertical: 'top' as const, expected: 'flex-start' },
      { vertical: 'middle' as const, expected: 'center' },
      { vertical: 'bottom' as const, expected: 'flex-end' },
      { vertical: 'justify' as const, expected: 'stretch' },
      { vertical: 'distributed' as const, expected: 'stretch' },
    ];

    for (const { vertical, expected } of alignments) {
      const box = createBox({
        id: `test-valign-${vertical}`,
        rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
        alignment: { vertical },
      });

      const css = generateBoxCss(box);
      expect(css).toContain(`align-items: ${expected};`);
    }
  });

  it('追加ボーダースタイルが正しいCSSにマッピングされる', () => {
    const additionalStyles = [
      { style: 'dashDot' as const, expectedStyle: 'dashed', expectedWidth: '0.3mm' },
      { style: 'dashDotDot' as const, expectedStyle: 'dashed', expectedWidth: '0.3mm' },
      { style: 'mediumDashed' as const, expectedStyle: 'solid', expectedWidth: '0.7mm' },
      { style: 'mediumDashDot' as const, expectedStyle: 'solid', expectedWidth: '0.7mm' },
      { style: 'mediumDashDotDot' as const, expectedStyle: 'solid', expectedWidth: '0.7mm' },
      { style: 'slantDashDot' as const, expectedStyle: 'solid', expectedWidth: '0.7mm' },
    ];

    for (const { style, expectedStyle, expectedWidth } of additionalStyles) {
      const box = createBox({
        id: `test-border-${style}`,
        rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
        border: { top: { style, color: '000000' } },
      });

      const css = generateBoxCss(box);
      expect(css).toContain(`border-top: ${expectedWidth} ${expectedStyle} #000000;`);
    }
  });

  it('下線のCSSを生成する', () => {
    const box = createBox({
      id: 'test-underline',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      font: { underline: 'single' },
    });
    const css = generateBoxCss(box);
    expect(css).toContain('text-decoration: underline;');
  });

  it('取消線のCSSを生成する', () => {
    const box = createBox({
      id: 'test-strike',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      font: { strikethrough: true },
    });
    const css = generateBoxCss(box);
    expect(css).toContain('text-decoration: line-through;');
  });

  it('下線と取消線を同時に生成する', () => {
    const box = createBox({
      id: 'test-both',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      font: { underline: 'single', strikethrough: true },
    });
    const css = generateBoxCss(box);
    expect(css).toContain('text-decoration: underline line-through;');
  });

  it('textRotation=255 で縦書きCSSを生成する', () => {
    const box = createBox({
      id: 'test-vertical',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      alignment: { textRotation: 255 },
    });
    const css = generateBoxCss(box);
    expect(css).toContain('writing-mode: vertical-rl;');
    expect(css).toContain('text-orientation: upright;');
  });

  it('textRotation=45 で回転CSSを生成する', () => {
    const box = createBox({
      id: 'test-rotate',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      alignment: { textRotation: 45 },
    });
    const css = generateBoxCss(box);
    expect(css).toContain('transform: rotate(-45deg);');
  });

  it('shrinkToFit のCSSを生成する', () => {
    const box = createBox({
      id: 'test-shrink',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      alignment: { shrinkToFit: true },
    });
    const css = generateBoxCss(box);
    expect(css).toContain('overflow: hidden;');
    expect(css).toContain('white-space: nowrap;');
  });

  it('distributed水平配置がjustifyにマッピングされる', () => {
    const box = createBox({
      id: 'test-distributed',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      alignment: { horizontal: 'distributed' },
    });
    const css = generateBoxCss(box);
    expect(css).toContain('text-align: justify;');
  });
});
