import type { BoxDefinition } from '@domain/box';
import { generateBoxCss } from '@domain/box';
import type { LineDefinition, LineStyle } from '@domain/line';
import type { PaperDefinition } from '@domain/paper';
import { INCHES_TO_MM, PAPER_DIMENSIONS } from '@domain/paper';
import type { VariableDefinition } from '@domain/variable';
import { generateManifest } from './ManifestGenerator';
import { classifyBoxRole } from './RoleClassifier';

type ExportParams = {
  readonly boxes: readonly BoxDefinition[];
  readonly lines: readonly LineDefinition[];
  readonly variables: readonly VariableDefinition[];
  readonly paper: PaperDefinition;
  readonly templateId: string;
  readonly templateVersion: string;
};

/** LineStyle → CSS border-style */
function lineStyleToCss(style: LineStyle): string {
  switch (style) {
    case 'thin':
    case 'hair':
    case 'medium':
    case 'thick':
      return 'solid';
    case 'dotted':
      return 'dotted';
    case 'dashed':
      return 'dashed';
    case 'double':
      return 'double';
  }
}

/** LineStyle → 線幅 (mm) */
function lineWidthMm(style: LineStyle): number {
  switch (style) {
    case 'hair':
      return 0.1;
    case 'thin':
      return 0.3;
    case 'medium':
      return 0.7;
    case 'thick':
      return 1.2;
    case 'dotted':
    case 'dashed':
      return 0.3;
    case 'double':
      return 0.7;
  }
}

/** 色文字列を CSS カラーに変換する */
function toCssColor(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/** 線分の CSS を生成する */
function generateLineCss(line: LineDefinition): string {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const width = lineWidthMm(line.style);
  const cssStyle = lineStyleToCss(line.style);
  const color = toCssColor(line.color);

  if (dy === 0) {
    // Horizontal line
    const x = Math.min(line.start.x, line.end.x);
    return [
      'position: absolute;',
      `left: ${x}mm;`,
      `top: ${line.start.y}mm;`,
      `width: ${Math.abs(dx)}mm;`,
      'height: 0;',
      `border-top: ${width}mm ${cssStyle} ${color};`,
    ].join(' ');
  }

  if (dx === 0) {
    // Vertical line
    const y = Math.min(line.start.y, line.end.y);
    return [
      'position: absolute;',
      `left: ${line.start.x}mm;`,
      `top: ${y}mm;`,
      'width: 0;',
      `height: ${Math.abs(dy)}mm;`,
      `border-left: ${width}mm ${cssStyle} ${color};`,
    ].join(' ');
  }

  // Diagonal line
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return [
    'position: absolute;',
    `left: ${line.start.x}mm;`,
    `top: ${line.start.y}mm;`,
    `width: ${length.toFixed(2)}mm;`,
    'height: 0;',
    `border-top: ${width}mm ${cssStyle} ${color};`,
    'transform-origin: 0 0;',
    `transform: rotate(${angle.toFixed(2)}deg);`,
  ].join(' ');
}

/** ボックスの表示コンテンツを取得する */
function getBoxDisplayContent(
  box: BoxDefinition,
  variables: readonly VariableDefinition[],
): string {
  const boundVar = variables.find((v) => v.boxId === box.id);
  if (boundVar) return `{{${boundVar.name}}}`;
  return escapeHtml(box.content);
}

/** HTML エスケープ */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** data-* 属性文字列を生成する */
function boxDataAttrs(
  box: BoxDefinition,
  role: string,
  variables: readonly VariableDefinition[],
): string {
  const attrs: string[] = [
    `data-box-id="${box.id}"`,
    `data-role="${role}"`,
    `data-x-mm="${box.rect.position.x}"`,
    `data-y-mm="${box.rect.position.y}"`,
    `data-w-mm="${box.rect.size.width}"`,
    `data-h-mm="${box.rect.size.height}"`,
  ];

  const boundVar = variables.find((v) => v.boxId === box.id);
  if (boundVar) {
    attrs.push(`data-variable="${boundVar.name}"`);
    attrs.push(`data-type="${boundVar.type}"`);
  }

  return attrs.join('\n       ');
}

/** 帳票テンプレートを HTML として出力する */
export function exportAsHtml(params: ExportParams): string {
  const { boxes, lines, variables, paper, templateId, templateVersion } = params;

  const dims =
    paper.orientation === 'landscape'
      ? { w: PAPER_DIMENSIONS[paper.size].height, h: PAPER_DIMENSIONS[paper.size].width }
      : { w: PAPER_DIMENSIONS[paper.size].width, h: PAPER_DIMENSIONS[paper.size].height };

  const marginsMm = {
    top: paper.margins.top * INCHES_TO_MM,
    right: paper.margins.right * INCHES_TO_MM,
    bottom: paper.margins.bottom * INCHES_TO_MM,
    left: paper.margins.left * INCHES_TO_MM,
  };

  const manifest = generateManifest({
    boxes,
    variables,
    paper,
    templateId,
    templateVersion,
  });

  // Build box HTML elements
  const boxElements = boxes.map((box) => {
    const role = classifyBoxRole(box, variables);
    const css = generateBoxCss(box);
    const content = getBoxDisplayContent(box, variables);
    const attrs = boxDataAttrs(box, role, variables);

    return `  <div class="box"\n       ${attrs}\n       style="${css.replace(/\n/g, ' ')}">${content}</div>`;
  });

  // Build line HTML elements
  const lineElements = lines.map((line) => {
    const css = generateLineCss(line);
    const widthMm = lineWidthMm(line.style);
    return `  <div class="line"\n       data-line-id="${line.id}"\n       data-x1-mm="${line.start.x}" data-y1-mm="${line.start.y}"\n       data-x2-mm="${line.end.x}" data-y2-mm="${line.end.y}"\n       data-stroke-width-mm="${widthMm}"\n       style="${css}"></div>`;
  });

  const printableWidth = paper.printableArea.width;
  const printableHeight = paper.printableArea.height;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(templateId)}</title>
<style>
  @page {
    size: ${dims.w}mm ${dims.h}mm;
    margin: ${marginsMm.top.toFixed(1)}mm ${marginsMm.right.toFixed(1)}mm ${marginsMm.bottom.toFixed(1)}mm ${marginsMm.left.toFixed(1)}mm;
  }
  .sheet {
    position: relative;
    width: ${printableWidth}mm;
    height: ${printableHeight}mm;
    overflow: hidden;
  }
  .box {
    overflow: hidden;
  }
</style>
</head>
<body>
<section class="sheet"
  data-template-id="${escapeHtml(templateId)}"
  data-template-version="${escapeHtml(templateVersion)}"
  data-paper-size="${paper.size}"
  data-orientation="${paper.orientation}"
  data-width-mm="${dims.w}"
  data-height-mm="${dims.h}"
  data-margin-top-mm="${marginsMm.top.toFixed(1)}"
  data-margin-right-mm="${marginsMm.right.toFixed(1)}"
  data-margin-bottom-mm="${marginsMm.bottom.toFixed(1)}"
  data-margin-left-mm="${marginsMm.left.toFixed(1)}"
  data-origin="printable-area">

${boxElements.join('\n\n')}

${lineElements.join('\n\n')}

</section>

<script type="application/json" id="template-manifest">
${JSON.stringify(manifest, null, 2)}
</script>
</body>
</html>`;
}
