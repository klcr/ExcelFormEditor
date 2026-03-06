import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_ALIGNMENT,
  DEFAULT_FONT,
  createBox,
  generateBoxId,
  resetBoxIdCounter,
} from './Box';

describe('createBox', () => {
  it('最小パラメータでデフォルト値を適用する', () => {
    const box = createBox({
      id: 'test-1',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
    });

    expect(box.id).toBe('test-1');
    expect(box.content).toBe('');
    expect(box.border).toEqual({});
    expect(box.font).toEqual(DEFAULT_FONT);
    expect(box.fill).toBeUndefined();
    expect(box.alignment).toEqual(DEFAULT_ALIGNMENT);
  });

  it('全パラメータを指定した場合はそのまま適用する', () => {
    const box = createBox({
      id: 'test-2',
      rect: { position: { x: 10, y: 20 }, size: { width: 100, height: 30 } },
      content: 'テスト',
      border: {
        top: { style: 'thin', color: '000000' },
        bottom: { style: 'medium', color: 'FF0000' },
      },
      font: {
        name: 'MS Gothic',
        sizePt: 14,
        bold: true,
        italic: false,
        color: '333333',
      },
      fill: { color: 'FFFF00' },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    });

    expect(box.content).toBe('テスト');
    expect(box.border.top).toEqual({ style: 'thin', color: '000000' });
    expect(box.border.bottom).toEqual({ style: 'medium', color: 'FF0000' });
    expect(box.border.left).toBeUndefined();
    expect(box.font.name).toBe('MS Gothic');
    expect(box.font.sizePt).toBe(14);
    expect(box.font.bold).toBe(true);
    expect(box.fill?.color).toBe('FFFF00');
    expect(box.alignment.horizontal).toBe('center');
    expect(box.alignment.vertical).toBe('middle');
    expect(box.alignment.wrapText).toBe(true);
  });

  it('部分的なフォント指定ではデフォルトをマージする', () => {
    const box = createBox({
      id: 'test-3',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      font: { bold: true },
    });

    expect(box.font.name).toBe(DEFAULT_FONT.name);
    expect(box.font.sizePt).toBe(DEFAULT_FONT.sizePt);
    expect(box.font.bold).toBe(true);
    expect(box.font.italic).toBe(DEFAULT_FONT.italic);
    expect(box.font.color).toBe(DEFAULT_FONT.color);
  });

  it('部分的な配置指定ではデフォルトをマージする', () => {
    const box = createBox({
      id: 'test-4',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 10 } },
      alignment: { horizontal: 'right' },
    });

    expect(box.alignment.horizontal).toBe('right');
    expect(box.alignment.vertical).toBe(DEFAULT_ALIGNMENT.vertical);
    expect(box.alignment.wrapText).toBe(DEFAULT_ALIGNMENT.wrapText);
  });

  it('rect の値が正しく保持される', () => {
    const rect = { position: { x: 15.5, y: 22.3 }, size: { width: 80.1, height: 12.7 } };
    const box = createBox({ id: 'test-5', rect });

    expect(box.rect).toEqual(rect);
  });
});

describe('generateBoxId', () => {
  beforeEach(() => {
    resetBoxIdCounter();
  });

  it('連番の ID を生成する', () => {
    expect(generateBoxId()).toBe('box-1');
    expect(generateBoxId()).toBe('box-2');
    expect(generateBoxId()).toBe('box-3');
  });

  it('リセット後はカウンタが 0 に戻る', () => {
    generateBoxId();
    generateBoxId();
    resetBoxIdCounter();
    expect(generateBoxId()).toBe('box-1');
  });
});

describe('DEFAULT_FONT', () => {
  it('Calibri 11pt のデフォルト値を持つ', () => {
    expect(DEFAULT_FONT).toEqual({
      name: 'Calibri',
      sizePt: 11,
      bold: false,
      italic: false,
      color: '000000',
    });
  });
});

describe('DEFAULT_ALIGNMENT', () => {
  it('左上揃え・折り返しなしのデフォルト値を持つ', () => {
    expect(DEFAULT_ALIGNMENT).toEqual({
      horizontal: 'left',
      vertical: 'top',
      wrapText: false,
    });
  });
});
