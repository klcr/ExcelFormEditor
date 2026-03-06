import type { BorderStyle } from '@domain/box';

/** BorderStyle → SVG stroke-width (mm 単位) */
export function borderStyleToStrokeWidth(style: BorderStyle): number {
  switch (style) {
    case 'hair':
      return 0.1;
    case 'thin':
      return 0.2;
    case 'medium':
      return 0.4;
    case 'thick':
      return 0.7;
    case 'dotted':
      return 0.2;
    case 'dashed':
      return 0.2;
    case 'double':
      return 0.4;
    default:
      return 0.2;
  }
}

/** BorderStyle → SVG stroke-dasharray */
export function borderStyleToStrokeDasharray(style: BorderStyle): string | undefined {
  switch (style) {
    case 'dotted':
      return '0.3 0.3';
    case 'dashed':
      return '1 0.5';
    default:
      return undefined;
  }
}
