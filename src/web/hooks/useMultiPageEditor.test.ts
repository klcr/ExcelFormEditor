import type { BoxDefinition } from '@domain/box';
import type { PageDefinition } from '@domain/page';
import { createPaperDefinition } from '@domain/paper';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMultiPageEditor } from './useMultiPageEditor';

function createTestPaper() {
  const result = createPaperDefinition({ size: 'A4', orientation: 'portrait' });
  if (!result.ok) throw new Error('Failed to create paper');
  return result.paper;
}

function createTestBox(id: string): BoxDefinition {
  return {
    id,
    rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
    content: '',
    border: {},
    font: { name: 'Calibri', sizePt: 11, bold: false, italic: false, color: '000000' },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: false },
  };
}

function createTestPages(): PageDefinition[] {
  const paper = createTestPaper();
  return [
    { pageIndex: 0, sheetName: 'Sheet1', paper, boxes: [createTestBox('p0-box-1')], lines: [] },
    { pageIndex: 1, sheetName: 'Sheet2', paper, boxes: [createTestBox('p1-box-1')], lines: [] },
  ];
}

describe('useMultiPageEditor', () => {
  it('初期状態で最初のページがアクティブになる', () => {
    const pages = createTestPages();
    const { result } = renderHook(() => useMultiPageEditor(pages));

    expect(result.current.activePageIndex).toBe(0);
    expect(result.current.activePage?.sheetName).toBe('Sheet1');
  });

  it('switchPage でアクティブページを切り替えられる', () => {
    const pages = createTestPages();
    const { result } = renderHook(() => useMultiPageEditor(pages));

    act(() => result.current.switchPage(1));

    expect(result.current.activePageIndex).toBe(1);
    expect(result.current.activePage?.sheetName).toBe('Sheet2');
  });

  it('存在しないページインデックスでは切り替わらない', () => {
    const pages = createTestPages();
    const { result } = renderHook(() => useMultiPageEditor(pages));

    act(() => result.current.switchPage(99));

    expect(result.current.activePageIndex).toBe(0);
  });

  it('updatePageBoxes でページのボックスを更新できる', () => {
    const pages = createTestPages();
    const { result } = renderHook(() => useMultiPageEditor(pages));

    const newBoxes = [createTestBox('p0-box-1'), createTestBox('p0-box-2')];
    act(() => result.current.updatePageBoxes(0, newBoxes));

    expect(result.current.pages[0]?.boxes).toHaveLength(2);
    expect(result.current.pages[0]?.boxes[1]?.id).toBe('p0-box-2');
  });

  it('ページ切替後も別ページの編集状態が保持される', () => {
    const pages = createTestPages();
    const { result } = renderHook(() => useMultiPageEditor(pages));

    // Edit page 0
    const newBoxes = [createTestBox('p0-box-1'), createTestBox('p0-box-new')];
    act(() => result.current.updatePageBoxes(0, newBoxes));

    // Switch to page 1
    act(() => result.current.switchPage(1));
    expect(result.current.activePage?.sheetName).toBe('Sheet2');

    // Switch back to page 0
    act(() => result.current.switchPage(0));
    expect(result.current.activePage?.boxes).toHaveLength(2);
    expect(result.current.activePage?.boxes[1]?.id).toBe('p0-box-new');
  });

  it('pages プロパティが全ページの最新状態を返す', () => {
    const pages = createTestPages();
    const { result } = renderHook(() => useMultiPageEditor(pages));

    expect(result.current.pages).toHaveLength(2);
    expect(result.current.pages[0]?.sheetName).toBe('Sheet1');
    expect(result.current.pages[1]?.sheetName).toBe('Sheet2');
  });
});
