/** フォント情報（styles.xml から抽出） */
export type FontEntry = {
  readonly name?: string;
  readonly size?: number;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly color?: string;
  readonly underline?: string;
  readonly strikethrough?: boolean;
};

/** 塗りつぶし情報（styles.xml から抽出） */
export type FillEntry = {
  readonly color?: string;
};

/** 罫線1辺（styles.xml から抽出） */
export type BorderEdgeEntry = {
  readonly style?: string;
  readonly color?: string;
};

/** 罫線4辺（styles.xml から抽出） */
export type BorderEntry = {
  readonly top?: BorderEdgeEntry;
  readonly bottom?: BorderEdgeEntry;
  readonly left?: BorderEdgeEntry;
  readonly right?: BorderEdgeEntry;
};

/** セル書式エントリ（cellXfs の1要素） */
export type XfEntry = {
  readonly fontId: number;
  readonly fillId: number;
  readonly borderId: number;
  readonly numFmtId: number;
  readonly applyFont?: boolean;
  readonly applyFill?: boolean;
  readonly applyBorder?: boolean;
  readonly applyAlignment?: boolean;
  readonly alignment?: {
    readonly horizontal?: string;
    readonly vertical?: string;
    readonly wrapText?: boolean;
    readonly textRotation?: number;
    readonly shrinkToFit?: boolean;
  };
};

/** styles.xml パース結果 */
export type ParsedStyles = {
  readonly fonts: readonly FontEntry[];
  readonly fills: readonly FillEntry[];
  readonly borders: readonly BorderEntry[];
  readonly cellXfs: readonly XfEntry[];
  readonly numFmts: ReadonlyMap<number, string>;
};

/** テーマカラーパレット（xl/theme/theme1.xml から抽出、index 0-11） */
export type ThemeColorPalette = readonly string[];

/** シート情報（workbook.xml + .rels から取得） */
export type SheetInfo = {
  readonly name: string;
  readonly sheetId: number;
  readonly rId: string;
  readonly path: string;
};
