import { beforeEach, describe, expect, it } from 'vitest';
import { createBox, resetBoxIdCounter } from './Box';
import { mergeBoxes, validateMerge } from './BoxMerge';
import type { BoxDefinition } from './BoxTypes';

function makeBox(overrides: {
  id?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  content?: string;
  border?: BoxDefinition['border'];
}): BoxDefinition {
  return createBox({
    id: overrides.id ?? 'test-box',
    rect: {
      position: { x: overrides.x ?? 0, y: overrides.y ?? 0 },
      size: { width: overrides.w ?? 100, height: overrides.h ?? 50 },
    },
    content: overrides.content ?? '',
    border: overrides.border,
  });
}

describe('validateMerge', () => {
  beforeEach(() => resetBoxIdCounter());

  it('空配列は invalid', () => {
    const result = validateMerge([]);
    expect(result).toEqual({ valid: false, reason: 'マージには2つ以上のボックスが必要です' });
  });

  it('1つのボックスは invalid', () => {
    const box = makeBox({ id: 'a' });
    const result = validateMerge([box]);
    expect(result).toEqual({ valid: false, reason: 'マージには2つ以上のボックスが必要です' });
  });

  it('水平隣接する2つのボックスは valid', () => {
    const left = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 30 });
    const right = makeBox({ id: 'b', x: 50, y: 0, w: 50, h: 30 });
    expect(validateMerge([left, right])).toEqual({ valid: true });
  });

  it('垂直隣接する2つのボックスは valid', () => {
    const top = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 20 });
    const bottom = makeBox({ id: 'b', x: 0, y: 20, w: 50, h: 30 });
    expect(validateMerge([top, bottom])).toEqual({ valid: true });
  });

  it('2x2 グリッドは valid', () => {
    const tl = makeBox({ id: 'tl', x: 0, y: 0, w: 40, h: 30 });
    const tr = makeBox({ id: 'tr', x: 40, y: 0, w: 60, h: 30 });
    const bl = makeBox({ id: 'bl', x: 0, y: 30, w: 40, h: 20 });
    const br = makeBox({ id: 'br', x: 40, y: 30, w: 60, h: 20 });
    expect(validateMerge([tl, tr, bl, br])).toEqual({ valid: true });
  });

  it('隙間がある場合は invalid', () => {
    const left = makeBox({ id: 'a', x: 0, y: 0, w: 40, h: 30 });
    const right = makeBox({ id: 'b', x: 60, y: 0, w: 40, h: 30 });
    const result = validateMerge([left, right]);
    expect(result.valid).toBe(false);
  });

  it('重なりがある場合は invalid', () => {
    const a = makeBox({ id: 'a', x: 0, y: 0, w: 60, h: 30 });
    const b = makeBox({ id: 'b', x: 50, y: 0, w: 50, h: 30 });
    const result = validateMerge([a, b]);
    expect(result.valid).toBe(false);
  });
});

describe('mergeBoxes', () => {
  beforeEach(() => resetBoxIdCounter());

  it('水平隣接ボックスを結合する', () => {
    const left = makeBox({ id: 'a', x: 10, y: 20, w: 50, h: 30, content: 'Left' });
    const right = makeBox({ id: 'b', x: 60, y: 20, w: 40, h: 30, content: 'Right' });
    const merged = mergeBoxes([left, right]);

    expect(merged.rect.position).toEqual({ x: 10, y: 20 });
    expect(merged.rect.size).toEqual({ width: 90, height: 30 });
    expect(merged.content).toBe('Left');
  });

  it('垂直隣接ボックスを結合する', () => {
    const top = makeBox({ id: 'a', x: 5, y: 10, w: 60, h: 25, content: 'Top' });
    const bottom = makeBox({ id: 'b', x: 5, y: 35, w: 60, h: 15, content: 'Bottom' });
    const merged = mergeBoxes([top, bottom]);

    expect(merged.rect.position).toEqual({ x: 5, y: 10 });
    expect(merged.rect.size).toEqual({ width: 60, height: 40 });
    expect(merged.content).toBe('Top');
  });

  it('左上のボックスの content/font/fill/alignment を継承する', () => {
    const topLeft = createBox({
      id: 'tl',
      rect: { position: { x: 0, y: 0 }, size: { width: 50, height: 30 } },
      content: 'Primary',
      font: { bold: true, sizePt: 14 },
      fill: { color: 'FF0000' },
      alignment: { horizontal: 'center' },
    });
    const topRight = createBox({
      id: 'tr',
      rect: { position: { x: 50, y: 0 }, size: { width: 50, height: 30 } },
      content: 'Secondary',
      font: { bold: false, sizePt: 10 },
    });

    const merged = mergeBoxes([topRight, topLeft]); // 順序に関係なく左上を使用
    expect(merged.content).toBe('Primary');
    expect(merged.font.bold).toBe(true);
    expect(merged.font.sizePt).toBe(14);
    expect(merged.fill).toEqual({ color: 'FF0000' });
    expect(merged.alignment.horizontal).toBe('center');
  });

  it('外周のボーダーのみ保持する', () => {
    const left = makeBox({
      id: 'a',
      x: 0,
      y: 0,
      w: 50,
      h: 30,
      border: {
        top: { style: 'thick', color: '000000' },
        bottom: { style: 'thin', color: '000000' },
        left: { style: 'medium', color: '000000' },
        right: { style: 'dashed', color: '999999' }, // 内側 → 捨てられる
      },
    });
    const right = makeBox({
      id: 'b',
      x: 50,
      y: 0,
      w: 50,
      h: 30,
      border: {
        top: { style: 'thick', color: '000000' },
        bottom: { style: 'thin', color: '000000' },
        left: { style: 'dotted', color: '888888' }, // 内側 → 捨てられる
        right: { style: 'double', color: '000000' },
      },
    });
    const merged = mergeBoxes([left, right]);

    expect(merged.border.top).toEqual({ style: 'thick', color: '000000' });
    expect(merged.border.bottom).toEqual({ style: 'thin', color: '000000' });
    expect(merged.border.left).toEqual({ style: 'medium', color: '000000' });
    expect(merged.border.right).toEqual({ style: 'double', color: '000000' });
  });

  it('元のボックスを変更しない（イミュータブル）', () => {
    const a = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 30 });
    const b = makeBox({ id: 'b', x: 50, y: 0, w: 50, h: 30 });
    const originalA = {
      ...a,
      rect: { ...a.rect, position: { ...a.rect.position }, size: { ...a.rect.size } },
    };

    mergeBoxes([a, b]);

    expect(a.rect.position).toEqual(originalA.rect.position);
    expect(a.rect.size).toEqual(originalA.rect.size);
  });

  it('新しい ID を生成する', () => {
    const a = makeBox({ id: 'a', x: 0, y: 0, w: 50, h: 30 });
    const b = makeBox({ id: 'b', x: 50, y: 0, w: 50, h: 30 });
    const merged = mergeBoxes([a, b]);

    expect(merged.id).not.toBe('a');
    expect(merged.id).not.toBe('b');
    expect(merged.id).toMatch(/^box-/);
  });

  it('invalid なボックス群でエラーを投げる', () => {
    const a = makeBox({ id: 'a', x: 0, y: 0, w: 40, h: 30 });
    const b = makeBox({ id: 'b', x: 60, y: 0, w: 40, h: 30 });
    expect(() => mergeBoxes([a, b])).toThrow('マージ不可');
  });

  it('2x2 グリッドを1つに結合する', () => {
    const tl = makeBox({ id: 'tl', x: 0, y: 0, w: 40, h: 30, content: 'TL' });
    const tr = makeBox({ id: 'tr', x: 40, y: 0, w: 60, h: 30 });
    const bl = makeBox({ id: 'bl', x: 0, y: 30, w: 40, h: 20 });
    const br = makeBox({ id: 'br', x: 40, y: 30, w: 60, h: 20 });
    const merged = mergeBoxes([br, tl, tr, bl]); // 順序不問

    expect(merged.rect.position).toEqual({ x: 0, y: 0 });
    expect(merged.rect.size).toEqual({ width: 100, height: 50 });
    expect(merged.content).toBe('TL');
  });
});
