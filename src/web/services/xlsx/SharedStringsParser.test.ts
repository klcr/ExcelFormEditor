import { describe, expect, it } from 'vitest';
import { parseSharedStrings } from './SharedStringsParser';

describe('parseSharedStrings', () => {
  it('プレーンテキストを抽出する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="3" uniqueCount="3">
        <si><t>Hello</t></si>
        <si><t>World</t></si>
        <si><t>請求書</t></si>
      </sst>`;
    expect(parseSharedStrings(xml)).toEqual(['Hello', 'World', '請求書']);
  });

  it('リッチテキストの run を連結する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <si>
          <r><rPr><b/></rPr><t>bold</t></r>
          <r><t> normal</t></r>
        </si>
      </sst>`;
    expect(parseSharedStrings(xml)).toEqual(['bold normal']);
  });

  it('空文字列を保持する', () => {
    const xml = `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <si><t>text</t></si>
      <si><t></t></si>
    </sst>`;
    const result = parseSharedStrings(xml);
    expect(result).toEqual(['text', '']);
  });

  it('空白を保持する (xml:space="preserve")', () => {
    const xml = `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <si><t xml:space="preserve"> spaced </t></si>
    </sst>`;
    const result = parseSharedStrings(xml);
    expect(result[0]).toBe(' spaced ');
  });

  it('数値テキストを文字列として返す', () => {
    const xml = `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <si><t>123</t></si>
    </sst>`;
    expect(parseSharedStrings(xml)).toEqual(['123']);
  });

  it('si が1件のみでも配列として処理する', () => {
    const xml = `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <si><t>only one</t></si>
    </sst>`;
    expect(parseSharedStrings(xml)).toEqual(['only one']);
  });

  it('数値文字参照（&#NNN;）をデコードする', () => {
    const xml = `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <si><t>&#9675;&#9675;&#12471;&#12473;&#12486;&#12512;</t></si>
      <si><t>&#25215;&#35469;&#27396;</t></si>
    </sst>`;
    expect(parseSharedStrings(xml)).toEqual(['○○システム', '承認欄']);
  });

  it('空の sst を処理する', () => {
    const xml = `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"/>`;
    expect(parseSharedStrings(xml)).toEqual([]);
  });
});
