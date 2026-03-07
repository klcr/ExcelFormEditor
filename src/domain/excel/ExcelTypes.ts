import type { Margins } from '@domain/paper';

/** 罫線の1辺（生データ） */
export type RawBorderEdge = {
  readonly style?: string;
  readonly color?: string;
};

/** セルスタイル（生データ） */
export type RawCellStyle = {
  readonly font?: {
    readonly name?: string;
    readonly size?: number;
    readonly bold?: boolean;
    readonly italic?: boolean;
    readonly color?: string;
  };
  readonly border?: {
    readonly top?: RawBorderEdge;
    readonly bottom?: RawBorderEdge;
    readonly left?: RawBorderEdge;
    readonly right?: RawBorderEdge;
  };
  readonly fill?: {
    readonly color?: string;
  };
  readonly alignment?: {
    readonly horizontal?: string;
    readonly vertical?: string;
    readonly wrapText?: boolean;
  };
};

/** セル情報（生データ） */
export type RawCell = {
  readonly address: string;
  readonly row: number;
  readonly col: number;
  readonly value: string;
  readonly style: RawCellStyle;
  readonly isMerged: boolean;
  /** マスターセルの場合のみ結合範囲（例: 'A1:C2'） */
  readonly mergeRange?: string;
};

/** ページ設定（生データ） */
export type RawPageSetup = {
  /** Excel paperSize 番号（9=A4, 8=A3, 11=A5） */
  readonly paperSize?: number;
  readonly orientation?: string;
  readonly scale?: number;
  readonly fitToPage?: boolean;
  readonly fitToWidth?: number;
  readonly fitToHeight?: number;
  readonly printArea?: string;
};

/** シートデータ（生データ、ドメイン入力型） */
export type RawSheetData = {
  readonly name: string;
  readonly pageSetup: RawPageSetup;
  readonly margins: Margins | null;
  /** 列幅（文字数単位）。index=0 が col 1 */
  readonly columnWidths: readonly number[];
  /** 行高（pt単位）。index=0 が row 1 */
  readonly rowHeights: readonly number[];
  readonly cells: readonly RawCell[];
  /** 結合範囲（例: ['A1:C2', 'D5:D8']） */
  readonly merges: readonly string[];
  /** 行改ページ位置（1-indexed）。行Nにブレークがある = 行Nの後で改ページ */
  readonly rowBreaks: readonly number[];
};

/** Excelデータ全体（生データ） */
export type RawExcelData = {
  readonly sheets: readonly RawSheetData[];
};
