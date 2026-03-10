import type { BorderStyle } from '@domain/box';

/** BorderStyle → SVG stroke-width (mm 単位) */
export function borderStyleToStrokeWidth(style: BorderStyle): number {
  switch (style) {
    case 'hair':
      return 0.1;
    case 'thin':
    case 'dotted':
    case 'dashed':
    case 'dashDot':
    case 'dashDotDot':
      return 0.2;
    case 'medium':
    case 'double':
    case 'mediumDashed':
    case 'mediumDashDot':
    case 'mediumDashDotDot':
    case 'slantDashDot':
      return 0.4;
    case 'thick':
      return 0.7;
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
    case 'mediumDashed':
      return '1 0.5';
    case 'dashDot':
    case 'mediumDashDot':
    case 'slantDashDot':
      return '1 0.3 0.3 0.3';
    case 'dashDotDot':
    case 'mediumDashDotDot':
      return '1 0.3 0.3 0.3 0.3 0.3';
    default:
      return undefined;
  }
}
