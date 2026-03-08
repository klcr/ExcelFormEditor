import { exportMultiPageAsHtml } from '@domain/export';
import type { PageDefinition } from '@domain/page';
import { prefixPageIds } from '@domain/page';
import { createPaperDefinition } from '@domain/paper';
import { AppLayout } from '@web/components/common/AppLayout';
import { BottomNav } from '@web/components/common/BottomNav';
import { Header } from '@web/components/common/Header';
import { PageTabs } from '@web/components/common/PageTabs';
import { Sidebar } from '@web/components/common/Sidebar';
import { DebugPanel } from '@web/components/debug/DebugPanel';
import { EditorLayout } from '@web/components/editor/EditorLayout';
import { PreviewCanvas } from '@web/components/preview/PreviewCanvas';
import { FileUploader } from '@web/components/upload/FileUploader';
import type { PageGroup } from '@web/components/upload/PageSelector';
import { PageSelector } from '@web/components/upload/PageSelector';
import { useExcelParse } from '@web/hooks/useExcelParse';
import { useFileUpload } from '@web/hooks/useFileUpload';
import { useLayoutMode } from '@web/hooks/useLayoutMode';
import { useMultiPageEditor } from '@web/hooks/useMultiPageEditor';
import type { SheetParseOutput } from '@web/services/parseExcelFile';
import { downloadFile } from '@web/utils/downloadFile';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './App.module.css';

const defaultPaperResult = createPaperDefinition({
  size: 'A4',
  orientation: 'portrait',
});
const defaultPaper = defaultPaperResult.ok ? defaultPaperResult.paper : null;

type AppMode = 'upload' | 'preview' | 'editor';

const NAV_ITEMS = [
  { id: 'upload', label: 'アップロード' },
  { id: 'preview', label: 'プレビュー' },
  { id: 'editor', label: '編集' },
] as const;

const EMPTY_PAGES: readonly PageDefinition[] = [];

/** 全シートをフラットな PageDefinition[] に変換する */
function flattenAllSheets(sheets: readonly SheetParseOutput[]): PageDefinition[] {
  const pages: PageDefinition[] = [];
  let pageIndex = 0;

  for (const sheet of sheets) {
    const totalSubPages = sheet.pages.length;
    for (let subIdx = 0; subIdx < totalSubPages; subIdx++) {
      const parsed = sheet.pages[subIdx];
      if (!parsed) continue;

      const pageName =
        totalSubPages > 1 ? `${sheet.sheetName} (${subIdx + 1}/${totalSubPages})` : sheet.sheetName;
      pages.push(prefixPageIds(parsed, pageIndex, pageName));
      pageIndex++;
    }
  }

  return pages;
}

/** SheetParseOutput[] と allPages からツリー構造の PageGroup[] を構築する */
function buildPageGroups(
  sheets: readonly SheetParseOutput[],
  allPages: readonly PageDefinition[],
): PageGroup[] {
  let offset = 0;
  return sheets.map((sheet) => {
    const pageCount = sheet.pages.length;
    const groupPages = allPages.slice(offset, offset + pageCount).map((p) => ({
      pageIndex: p.pageIndex,
      pageName: p.sheetName,
    }));
    offset += pageCount;
    return {
      sheetName: sheet.sheetName,
      pages: groupPages,
    };
  });
}

export function App() {
  const { file, handleFileSelect, clearFile } = useFileUpload();
  const { parseState } = useExcelParse(file);
  const layoutMode = useLayoutMode();
  const [activeMode, setActiveMode] = useState<AppMode>('upload');

  // Page-level selection state
  const [allPages, setAllPages] = useState<readonly PageDefinition[]>(EMPTY_PAGES);
  const [selectedPageIndices, setSelectedPageIndices] = useState<number[]>([]);
  const [hiddenPageIndices, setHiddenPageIndices] = useState<Set<number>>(new Set());

  const hasParseResult = parseState.status === 'success';

  // Visible pages = all pages minus hidden ones
  const visiblePages = useMemo(
    () => allPages.filter((p) => !hiddenPageIndices.has(p.pageIndex)),
    [allPages, hiddenPageIndices],
  );
  const hasPages = visiblePages.length > 0;

  // Build page groups for PageSelector
  const pageGroups = useMemo(() => {
    if (parseState.status !== 'success') return [];
    return buildPageGroups(parseState.result.sheets, allPages);
  }, [parseState, allPages]);

  // Auto-import all pages when parse succeeds
  useEffect(() => {
    if (parseState.status === 'success') {
      const pages = flattenAllSheets(parseState.result.sheets);
      setAllPages(pages);
      setSelectedPageIndices(pages.map((p) => p.pageIndex));
      setHiddenPageIndices(new Set());
      setActiveMode('preview');
    } else {
      setAllPages(EMPTY_PAGES);
      setSelectedPageIndices([]);
      setHiddenPageIndices(new Set());
    }
  }, [parseState]);

  // Multi-page editor state (uses visible pages)
  const { activePageIndex, activePage, pages, switchPage, updatePageBoxes } =
    useMultiPageEditor(visiblePages);

  // Handle page close from PageTabs
  const handlePageClose = useCallback(
    (pageIndex: number) => {
      setHiddenPageIndices((prev) => {
        const next = new Set(prev);
        next.add(pageIndex);
        return next;
      });
      setSelectedPageIndices((prev) => prev.filter((i) => i !== pageIndex));

      // If closing the active page, switch to an adjacent visible page
      if (pageIndex === activePageIndex) {
        const remaining = visiblePages.filter((p) => p.pageIndex !== pageIndex);
        if (remaining.length > 0) {
          const currentIdx = visiblePages.findIndex((p) => p.pageIndex === pageIndex);
          const nextPage = remaining[Math.min(currentIdx, remaining.length - 1)];
          if (nextPage) {
            switchPage(nextPage.pageIndex);
          }
        }
      }
    },
    [activePageIndex, visiblePages, switchPage],
  );

  // Handle multi-page export (only selected pages)
  const handleExport = useCallback(() => {
    const exportPages = pages.filter((p) => selectedPageIndices.includes(p.pageIndex));
    if (exportPages.length === 0) return;
    const templateId = file?.name.replace(/\.[^.]+$/, '') ?? 'template';
    const html = exportMultiPageAsHtml({
      pages: exportPages,
      pageVariables: new Map(),
      templateId,
      templateVersion: '1.0.0',
    });
    downloadFile(html, `${templateId}.html`, 'text/html');
  }, [pages, selectedPageIndices, file]);

  // Handle box changes from EditorLayout
  const handleBoxesChange = useCallback(
    (boxes: readonly import('@domain/box').BoxDefinition[]) => {
      updatePageBoxes(activePageIndex, boxes);
    },
    [activePageIndex, updatePageBoxes],
  );

  // Active page data (for preview/editor)
  const paper = activePage?.paper ?? defaultPaper;
  const boxes = activePage?.boxes ?? [];
  const lines = activePage?.lines ?? [];

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    disabled: item.id !== 'upload' && !hasPages,
  }));

  const pageTabs = hasPages ? (
    <PageTabs
      pages={visiblePages}
      activePageIndex={activePageIndex}
      onPageSelect={switchPage}
      onPageClose={handlePageClose}
    />
  ) : null;

  const pageSelector = (
    <PageSelector
      groups={pageGroups}
      selectedPageIndices={selectedPageIndices}
      onSelectionChange={setSelectedPageIndices}
      onExport={handleExport}
      exportDisabled={selectedPageIndices.length === 0}
    />
  );

  const renderMain = () => {
    if (layoutMode === 'mobile') {
      switch (activeMode) {
        case 'upload':
          return (
            <div className={styles.mobileUpload}>
              <FileUploader
                onFileSelect={handleFileSelect}
                acceptedFile={file}
                onClear={clearFile}
              />
              {hasParseResult && pageSelector}
            </div>
          );
        case 'preview':
          return (
            <>
              {pageTabs}
              <PreviewCanvas paper={paper} boxes={boxes} lines={lines} />
            </>
          );
        case 'editor':
          return (
            <>
              {pageTabs}
              <EditorLayout
                key={activePageIndex}
                paper={paper}
                boxes={boxes}
                layoutMode="mobile"
                onBoxesChange={handleBoxesChange}
              />
            </>
          );
      }
    }

    if (activeMode === 'editor') {
      return (
        <>
          {pageTabs}
          <EditorLayout
            key={activePageIndex}
            paper={paper}
            boxes={boxes}
            layoutMode="desktop"
            onBoxesChange={handleBoxesChange}
          />
        </>
      );
    }
    return (
      <>
        {pageTabs}
        <PreviewCanvas paper={paper} boxes={boxes} lines={lines} />
        <DebugPanel parseState={parseState} />
      </>
    );
  };

  return (
    <AppLayout
      layoutMode={layoutMode}
      header={<Header />}
      sidebar={
        <Sidebar>
          <FileUploader onFileSelect={handleFileSelect} acceptedFile={file} onClear={clearFile} />
          {hasParseResult && pageSelector}
          {hasPages && (
            <div className={styles.modeSwitch} data-testid="mode-switch">
              <button
                type="button"
                data-testid="preview-button"
                className={`${styles.modeButton} ${activeMode !== 'editor' ? styles.modeButtonActive : ''}`}
                onClick={() => setActiveMode('preview')}
              >
                プレビュー
              </button>
              <button
                type="button"
                data-testid="edit-button"
                className={`${styles.modeButton} ${activeMode === 'editor' ? styles.modeButtonActive : ''}`}
                onClick={() => setActiveMode('editor')}
              >
                編集
              </button>
            </div>
          )}
        </Sidebar>
      }
      main={renderMain()}
      bottomNav={
        layoutMode === 'mobile' ? (
          <BottomNav
            items={navItems}
            activeId={activeMode}
            onSelect={(id) => setActiveMode(id as AppMode)}
          />
        ) : undefined
      }
    />
  );
}
