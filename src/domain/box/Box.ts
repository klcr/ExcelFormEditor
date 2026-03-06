import type { Rect } from '@domain/shared';
import type { BoxAlignment, BoxBorder, BoxDefinition, BoxFill, BoxFont } from './BoxTypes';

/** デフォルトフォント（Calibri 11pt, 黒） */
export const DEFAULT_FONT: BoxFont = {
  name: 'Calibri',
  sizePt: 11,
  bold: false,
  italic: false,
  color: '000000',
};

/** デフォルト配置（左上、折り返しなし） */
export const DEFAULT_ALIGNMENT: BoxAlignment = {
  horizontal: 'left',
  vertical: 'top',
  wrapText: false,
};

/** createBox のパラメータ */
export type CreateBoxParams = {
  readonly id: string;
  readonly rect: Rect;
  readonly content?: string;
  readonly border?: BoxBorder;
  readonly font?: Partial<BoxFont>;
  readonly fill?: BoxFill;
  readonly alignment?: Partial<BoxAlignment>;
};

let boxCounter = 0;

/** 一意な Box ID を生成する */
export function generateBoxId(): string {
  boxCounter++;
  return `box-${boxCounter}`;
}

/** Box ID カウンターをリセットする（テスト用） */
export function resetBoxIdCounter(): void {
  boxCounter = 0;
}

/** BoxDefinition を生成するファクトリ関数 */
export function createBox(params: CreateBoxParams): BoxDefinition {
  return {
    id: params.id,
    rect: params.rect,
    content: params.content ?? '',
    border: params.border ?? {},
    font: {
      ...DEFAULT_FONT,
      ...stripUndefined(params.font ?? {}),
    },
    fill: params.fill,
    alignment: {
      ...DEFAULT_ALIGNMENT,
      ...stripUndefined(params.alignment ?? {}),
    },
  };
}

/** undefined 値を除去する */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
