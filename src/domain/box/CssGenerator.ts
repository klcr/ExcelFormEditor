import type {
  BorderEdge,
  BorderStyle,
  BoxDefinition,
  HorizontalAlignment,
  VerticalAlignment,
} from './BoxTypes';

/** pt → mm 変換係数 */
const PT_TO_MM = 0.353;

/** BorderStyle → CSS border-style マッピング */
function mapBorderStyle(style: BorderStyle): string {
  switch (style) {
    case 'thin':
    case 'hair':
    case 'medium':
    case 'thick':
    case 'mediumDashed':
    case 'mediumDashDot':
    case 'mediumDashDotDot':
    case 'slantDashDot':
      return 'solid';
    case 'dotted':
      return 'dotted';
    case 'dashed':
    case 'dashDot':
    case 'dashDotDot':
      return 'dashed';
    case 'double':
      return 'double';
  }
}

/** BorderStyle → CSS border-width マッピング */
function mapBorderWidth(style: BorderStyle): string {
  switch (style) {
    case 'hair':
      return '0.1mm';
    case 'thin':
    case 'dotted':
    case 'dashed':
    case 'dashDot':
    case 'dashDotDot':
      return '0.3mm';
    case 'medium':
    case 'double':
    case 'mediumDashed':
    case 'mediumDashDot':
    case 'mediumDashDotDot':
    case 'slantDashDot':
      return '0.7mm';
    case 'thick':
      return '1.2mm';
  }
}

/** 色文字列を CSS カラーに変換する */
function toCssColor(color: string): string {
  if (color.startsWith('#')) {
    return color;
  }
  return `#${color}`;
}

/** BorderEdge → CSS border 値を生成する */
function borderEdgeToCss(edge: BorderEdge): string {
  return `${mapBorderWidth(edge.style)} ${mapBorderStyle(edge.style)} ${toCssColor(edge.color)}`;
}

/** VerticalAlignment → CSS align-items 値マッピング */
function mapVerticalAlignment(vertical: VerticalAlignment): string {
  switch (vertical) {
    case 'top':
      return 'flex-start';
    case 'middle':
      return 'center';
    case 'bottom':
      return 'flex-end';
    case 'justify':
    case 'distributed':
      return 'stretch';
  }
}

/** HorizontalAlignment → CSS text-align/justify-content マッピング */
function mapHorizontalAlignment(horizontal: HorizontalAlignment): string {
  switch (horizontal) {
    case 'distributed':
      return 'justify';
    default:
      return horizontal;
  }
}

/** BoxDefinition から CSS 文字列を生成する */
export function generateBoxCss(box: BoxDefinition): string {
  const lines: string[] = [];

  // Position and size
  lines.push('position: absolute;');
  lines.push(`left: ${box.rect.position.x}mm;`);
  lines.push(`top: ${box.rect.position.y}mm;`);
  lines.push(`width: ${box.rect.size.width}mm;`);
  lines.push(`height: ${box.rect.size.height}mm;`);

  // Borders
  if (box.border.top) {
    lines.push(`border-top: ${borderEdgeToCss(box.border.top)};`);
  }
  if (box.border.bottom) {
    lines.push(`border-bottom: ${borderEdgeToCss(box.border.bottom)};`);
  }
  if (box.border.left) {
    lines.push(`border-left: ${borderEdgeToCss(box.border.left)};`);
  }
  if (box.border.right) {
    lines.push(`border-right: ${borderEdgeToCss(box.border.right)};`);
  }

  // Font
  lines.push(`font-family: '${box.font.name}';`);
  const fontSizeMm = (box.font.sizePt * PT_TO_MM).toFixed(2);
  lines.push(`font-size: ${fontSizeMm}mm;`);
  if (box.font.bold) {
    lines.push('font-weight: bold;');
  }
  if (box.font.italic) {
    lines.push('font-style: italic;');
  }
  if (box.font.underline) {
    lines.push('text-decoration: underline;');
  }
  if (box.font.strikethrough) {
    lines.push(
      `text-decoration: ${box.font.underline ? 'underline line-through' : 'line-through'};`,
    );
  }
  lines.push(`color: ${toCssColor(box.font.color)};`);

  // Fill
  if (box.fill) {
    lines.push(`background-color: ${toCssColor(box.fill.color)};`);
  }

  // Alignment (flexbox for vertical alignment)
  lines.push('display: flex;');
  lines.push(`align-items: ${mapVerticalAlignment(box.alignment.vertical)};`);
  lines.push(`text-align: ${mapHorizontalAlignment(box.alignment.horizontal)};`);

  // Wrap text
  if (box.alignment.wrapText) {
    lines.push('word-wrap: break-word;');
  }

  // Text rotation
  if (box.alignment.textRotation !== undefined) {
    if (box.alignment.textRotation === 255) {
      // 縦書き（1文字ずつ縦に配置）
      lines.push('writing-mode: vertical-rl;');
      lines.push('text-orientation: upright;');
    } else if (box.alignment.textRotation > 0) {
      // OOXML: 1-180 → CSS: 正の値は反時計回り (1-90)、91-180 は時計回り (-1 to -90)
      const deg =
        box.alignment.textRotation <= 90
          ? -box.alignment.textRotation
          : box.alignment.textRotation - 90;
      lines.push(`transform: rotate(${deg}deg);`);
    }
  }

  // Shrink to fit
  if (box.alignment.shrinkToFit) {
    lines.push('overflow: hidden;');
    lines.push('text-overflow: clip;');
    lines.push('white-space: nowrap;');
  }

  // Padding
  if (box.padding) {
    const { top, right, bottom, left } = box.padding;
    if (top === right && right === bottom && bottom === left) {
      lines.push(`padding: ${top}mm;`);
    } else {
      lines.push(`padding: ${top}mm ${right}mm ${bottom}mm ${left}mm;`);
    }
  }

  lines.push('box-sizing: border-box;');

  return lines.join('\n');
}
