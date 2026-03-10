export type {
  PaperSize,
  Orientation,
  Margins,
  ScalingConfig,
  PaperCentering,
  PaperDefinition,
} from './PaperTypes';

export type { HeaderFooterSection, HeaderFooterDefinition } from './HeaderFooterTypes';

export {
  PAPER_DIMENSIONS,
  DEFAULT_MARGINS,
  INCHES_TO_MM,
  PT_TO_MM,
} from './PaperTypes';

export type { CreatePaperParams } from './Paper';

export {
  getPaperDimensions,
  calculatePrintableArea,
  validateMargins,
  createPaperDefinition,
} from './Paper';

export {
  ptToMm,
  inchesToMm,
  excelColumnWidthToMm,
  calculateEffectiveScale,
  applyScale,
  applyScaleToSize,
} from './CoordinateConverter';

export { calculateCenteringOffset, calculateContentBounds } from './CenteringOffset';
