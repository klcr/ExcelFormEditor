import type { BoxDefinition } from '@domain/box';
import type { ParsedSheet } from '@domain/excel';
import type { LineDefinition } from '@domain/line';
import { createPaperDefinition } from '@domain/paper';
import { describe, expect, it } from 'vitest';
import { prefixPageIds } from './PageTypes';

function createTestPaper() {
  const result = createPaperDefinition({ size: 'A4', orientation: 'portrait' });
  if (!result.ok) throw new Error('Failed to create paper');
  return result.paper;
}

function createTestBox(id: string, content = ''): BoxDefinition {
  return {
    id,
    rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
    content,
    border: {},
    font: { name: 'Calibri', sizePt: 11, bold: false, italic: false, color: '000000' },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: false },
  };
}

function createTestLine(id: string): LineDefinition {
  return {
    id,
    start: { x: 0, y: 0 },
    end: { x: 10, y: 0 },
    style: 'thin',
    color: '000000',
  };
}

describe('prefixPageIds', () => {
  it('ボックス ID にページプレフィックスを付与する', () => {
    const sheet: ParsedSheet = {
      paper: createTestPaper(),
      boxes: [createTestBox('box-1'), createTestBox('box-2')],
      lines: [],
    };

    const page = prefixPageIds(sheet, 0, 'Sheet1');

    expect(page.boxes[0]?.id).toBe('p0-box-1');
    expect(page.boxes[1]?.id).toBe('p0-box-2');
  });

  it('線分 ID にページプレフィックスを付与する', () => {
    const sheet: ParsedSheet = {
      paper: createTestPaper(),
      boxes: [],
      lines: [createTestLine('line-1'), createTestLine('line-2')],
    };

    const page = prefixPageIds(sheet, 1, 'Sheet2');

    expect(page.lines[0]?.id).toBe('p1-line-1');
    expect(page.lines[1]?.id).toBe('p1-line-2');
  });

  it('pageIndex と sheetName を正しく設定する', () => {
    const sheet: ParsedSheet = {
      paper: createTestPaper(),
      boxes: [],
      lines: [],
    };

    const page = prefixPageIds(sheet, 2, '見積書');

    expect(page.pageIndex).toBe(2);
    expect(page.sheetName).toBe('見積書');
  });

  it('paper 定義をそのまま引き継ぐ', () => {
    const paper = createTestPaper();
    const sheet: ParsedSheet = { paper, boxes: [], lines: [] };

    const page = prefixPageIds(sheet, 0, 'Sheet1');

    expect(page.paper).toBe(paper);
  });

  it('ボックスの content やスタイルを保持する', () => {
    const box = createTestBox('box-1', '請求書');
    const sheet: ParsedSheet = {
      paper: createTestPaper(),
      boxes: [box],
      lines: [],
    };

    const page = prefixPageIds(sheet, 0, 'Sheet1');

    expect(page.boxes[0]?.content).toBe('請求書');
    expect(page.boxes[0]?.font).toEqual(box.font);
    expect(page.boxes[0]?.rect).toEqual(box.rect);
  });

  it('空のシート（ボックス・線分なし）を処理できる', () => {
    const sheet: ParsedSheet = {
      paper: createTestPaper(),
      boxes: [],
      lines: [],
    };

    const page = prefixPageIds(sheet, 0, 'Empty');

    expect(page.boxes).toHaveLength(0);
    expect(page.lines).toHaveLength(0);
  });

  it('異なるページインデックスで一意な ID を生成する', () => {
    const sheet: ParsedSheet = {
      paper: createTestPaper(),
      boxes: [createTestBox('box-1')],
      lines: [createTestLine('line-1')],
    };

    const page0 = prefixPageIds(sheet, 0, 'Sheet1');
    const page1 = prefixPageIds(sheet, 1, 'Sheet2');

    expect(page0.boxes[0]?.id).toBe('p0-box-1');
    expect(page1.boxes[0]?.id).toBe('p1-box-1');
    expect(page0.lines[0]?.id).toBe('p0-line-1');
    expect(page1.lines[0]?.id).toBe('p1-line-1');
  });
});
