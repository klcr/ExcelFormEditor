import { describe, expect, it } from 'vitest';
import { parseHeaderFooterContent } from './HeaderFooterParser';

describe('parseHeaderFooterContent', () => {
  it('L/C/R 3セクションを正しく分割する', () => {
    const result = parseHeaderFooterContent('&L左部&C中央部&R右部');
    expect(result).toEqual({ left: '左部', center: '中央部', right: '右部' });
  });

  it('特殊コードを保持する（&P = ページ番号、&N = 総ページ数）', () => {
    const result = parseHeaderFooterContent('&L&P/&N&C&D&R&F');
    expect(result.left).toBe('&P/&N');
    expect(result.center).toBe('&D');
    expect(result.right).toBe('&F');
  });

  it('フォント指定を保持する', () => {
    const result = parseHeaderFooterContent('&L&"Calibri,Bold"テキスト');
    expect(result.left).toBe('&"Calibri,Bold"テキスト');
  });

  it('フォントサイズを保持する', () => {
    const result = parseHeaderFooterContent('&C&12大きいサイズ');
    expect(result.center).toBe('&12大きいサイズ');
  });

  it('空文字列を処理する', () => {
    const result = parseHeaderFooterContent('');
    expect(result).toEqual({ left: '', center: '', right: '' });
  });

  it('undefined を処理する', () => {
    const result = parseHeaderFooterContent(undefined);
    expect(result).toEqual({ left: '', center: '', right: '' });
  });

  it('セクション指定がない場合はテキストを無視する', () => {
    const result = parseHeaderFooterContent('テキスト');
    expect(result).toEqual({ left: '', center: '', right: '' });
  });

  it('&& をリテラル & として解釈する', () => {
    const result = parseHeaderFooterContent('&C株式会社&&Co.');
    expect(result.center).toBe('株式会社&Co.');
  });

  it('複数の特殊コードを組み合わせる', () => {
    const result = parseHeaderFooterContent('&L&A&C&P ページ / &N ページ');
    expect(result.left).toBe('&A');
    expect(result.center).toBe('&P ページ / &N ページ');
  });

  it('C セクションのみの場合', () => {
    const result = parseHeaderFooterContent('&C&P');
    expect(result).toEqual({ left: '', center: '&P', right: '' });
  });

  it('フォント指定 + サイズ + テキストの組み合わせ', () => {
    const result = parseHeaderFooterContent('&L&"Arial,Regular"&10ページ &P');
    expect(result.left).toBe('&"Arial,Regular"&10ページ &P');
  });
});
