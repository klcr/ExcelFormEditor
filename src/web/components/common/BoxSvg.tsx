import type { BoxDefinition } from '@domain/box';
import { borderStyleToStrokeDasharray, borderStyleToStrokeWidth } from '@web/utils/svgHelpers';

/**
 * テキストを指定幅に収まるよう行分割する。
 * SVG にはネイティブの折り返しがないため、文字幅を推定して分割する。
 * CJK文字は fontSize 相当、ASCII文字は fontSize * 0.6 相当で概算。
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  if (maxWidth <= 0 || fontSize <= 0) return [text];

  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;
  const padding = 1.0; // 左右パディング分
  const availableWidth = maxWidth - padding;

  for (const char of text) {
    // CJK文字かどうかで文字幅を推定
    const charWidth = /[\u3000-\u9FFF\uF900-\uFAFF]/.test(char) ? fontSize : fontSize * 0.6;

    if (currentWidth + charWidth > availableWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
    } else {
      currentLine += char;
      currentWidth += charWidth;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * ボックスの視覚的な内容（塗りつぶし、罫線、テキスト）を SVG で描画する。
 * プレビューモードとエディタモードの両方で共通利用される。
 */
export function BoxSvg({ box }: { readonly box: BoxDefinition }) {
  const { x, y } = box.rect.position;
  const { width, height } = box.rect.size;
  const fontSize = Math.min(box.font.sizePt * 0.3528, height * 0.8);

  const clipId = `clip-${box.id}`;

  // テキスト折り返し
  const textLines =
    box.content && box.alignment.wrapText
      ? wrapText(box.content, width, fontSize)
      : box.content
        ? [box.content]
        : [];

  const lineHeight = fontSize * 1.2;
  const totalTextHeight = textLines.length * lineHeight;

  // テキストの x 座標
  const textX =
    x +
    (box.alignment.horizontal === 'center'
      ? width / 2
      : box.alignment.horizontal === 'right'
        ? width - 0.5
        : 0.5);

  // テキストの先頭 y 座標（垂直配置を考慮）
  const textStartY =
    box.alignment.vertical === 'middle'
      ? y + (height - totalTextHeight) / 2 + fontSize
      : box.alignment.vertical === 'bottom'
        ? y + height - totalTextHeight + fontSize - 0.5
        : y + fontSize;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      {box.fill && <rect x={x} y={y} width={width} height={height} fill={`#${box.fill.color}`} />}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={box.fill ? 'none' : 'transparent'}
        stroke="none"
      />
      {box.border.top && (
        <line
          x1={x}
          y1={y}
          x2={x + width}
          y2={y}
          stroke={`#${box.border.top.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.top.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.top.style)}
        />
      )}
      {box.border.bottom && (
        <line
          x1={x}
          y1={y + height}
          x2={x + width}
          y2={y + height}
          stroke={`#${box.border.bottom.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.bottom.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.bottom.style)}
        />
      )}
      {box.border.left && (
        <line
          x1={x}
          y1={y}
          x2={x}
          y2={y + height}
          stroke={`#${box.border.left.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.left.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.left.style)}
        />
      )}
      {box.border.right && (
        <line
          x1={x + width}
          y1={y}
          x2={x + width}
          y2={y + height}
          stroke={`#${box.border.right.color}`}
          strokeWidth={borderStyleToStrokeWidth(box.border.right.style)}
          strokeDasharray={borderStyleToStrokeDasharray(box.border.right.style)}
        />
      )}
      {textLines.length > 0 && (
        <text
          x={textX}
          textAnchor={
            box.alignment.horizontal === 'center'
              ? 'middle'
              : box.alignment.horizontal === 'right'
                ? 'end'
                : 'start'
          }
          fontSize={fontSize}
          fontFamily={box.font.name}
          fontWeight={box.font.bold ? 'bold' : 'normal'}
          fontStyle={box.font.italic ? 'italic' : 'normal'}
          fill={`#${box.font.color}`}
          clipPath={`url(#${clipId})`}
        >
          {textLines.map((line, i) => (
            <tspan key={`${box.id}-${i}`} x={textX} y={textStartY + i * lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}
