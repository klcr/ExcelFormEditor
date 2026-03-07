import type { Orientation, PaperSize } from '@domain/paper';
import type { VariableType } from '@domain/variable';

/** ボックスの役割 */
export type BoxRole = 'label' | 'field' | 'decoration';

/** 矩形領域（mm 単位） */
export type Region = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** 変数→ボックス→座標のマッピング */
export type FieldMapping = {
  readonly variableId: string;
  readonly variableName: string;
  readonly variableType: VariableType;
  readonly boxId: string;
  readonly region: Region;
  readonly absoluteRegion: Region;
};

/** 用紙情報（mm 単位） */
export type PaperInfo = {
  readonly size: PaperSize;
  readonly orientation: Orientation;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly margins: {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  };
};

/** テンプレートマニフェスト */
export type TemplateManifest = {
  readonly templateId: string;
  readonly version: string;
  readonly paper: PaperInfo;
  readonly fields: readonly FieldMapping[];
  readonly interface: string;
};
