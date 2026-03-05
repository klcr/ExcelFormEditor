export type {
  PaperSize,
  Orientation,
  Margins,
  ScalingConfig,
  PaperDefinition,
} from './PaperTypes';

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
