import type { BoxDefinition } from '@domain/box';
import type { ParsedSheet } from '@domain/excel';
import type { LineDefinition } from '@domain/line';
import type { PaperDefinition } from '@domain/paper';

/** ページ定義（1シート = 1ページ） */
export type PageDefinition = {
  readonly pageIndex: number;
  readonly sheetName: string;
  readonly paper: PaperDefinition;
  readonly boxes: readonly BoxDefinition[];
  readonly lines: readonly LineDefinition[];
};

/** ボックス・線分 ID にページプレフィックスを付与して PageDefinition を生成する */
export function prefixPageIds(
  sheet: ParsedSheet,
  pageIndex: number,
  sheetName: string,
): PageDefinition {
  const prefix = `p${pageIndex}-`;

  const boxes: readonly BoxDefinition[] = sheet.boxes.map((box) => ({
    ...box,
    id: `${prefix}${box.id}`,
  }));

  const lines: readonly LineDefinition[] = sheet.lines.map((line) => ({
    ...line,
    id: `${prefix}${line.id}`,
  }));

  return {
    pageIndex,
    sheetName,
    paper: sheet.paper,
    boxes,
    lines,
  };
}
