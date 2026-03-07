import type { BoxDefinition } from '@domain/box';
import type { PageDefinition } from '@domain/page';
import { useCallback, useMemo, useState } from 'react';

type PageState = {
  readonly boxes: readonly BoxDefinition[];
};

type UseMultiPageEditorReturn = {
  readonly activePageIndex: number;
  readonly activePage: PageDefinition | undefined;
  readonly pages: readonly PageDefinition[];
  readonly switchPage: (pageIndex: number) => void;
  readonly updatePageBoxes: (pageIndex: number, boxes: readonly BoxDefinition[]) => void;
};

/**
 * マルチページの状態管理フック。
 * 各ページのボックス編集状態を保持し、ページ切り替えを管理する。
 * Undo/Redo 履歴はページ切替時にリセットされる（key によるリマウント方式）。
 */
export function useMultiPageEditor(
  initialPages: readonly PageDefinition[],
): UseMultiPageEditorReturn {
  const [activePageIndex, setActivePageIndex] = useState(0);

  // per-page edited box state (overrides initial boxes)
  const [pageStates, setPageStates] = useState<ReadonlyMap<number, PageState>>(() => new Map());

  const pages: readonly PageDefinition[] = useMemo(
    () =>
      initialPages.map((page) => {
        const state = pageStates.get(page.pageIndex);
        if (state) {
          return { ...page, boxes: state.boxes };
        }
        return page;
      }),
    [initialPages, pageStates],
  );

  const activePage = pages.find((p) => p.pageIndex === activePageIndex);

  const switchPage = useCallback(
    (pageIndex: number) => {
      if (pages.some((p) => p.pageIndex === pageIndex)) {
        setActivePageIndex(pageIndex);
      }
    },
    [pages],
  );

  const updatePageBoxes = useCallback((pageIndex: number, boxes: readonly BoxDefinition[]) => {
    setPageStates((prev) => {
      const next = new Map(prev);
      next.set(pageIndex, { boxes });
      return next;
    });
  }, []);

  return {
    activePageIndex,
    activePage,
    pages,
    switchPage,
    updatePageBoxes,
  };
}
