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
import { SheetSelector } from '@web/components/upload/SheetSelector';
import { useExcelParse } from '@web/hooks/useExcelParse';
import { useFileUpload } from '@web/hooks/useFileUpload';
import { useLayoutMode } from '@web/hooks/useLayoutMode';
import { useMultiPageEditor } from '@web/hooks/useMultiPageEditor';
import type { SheetParseOutput } from '@web/services/parseExcelFile';
import { paperSizeLabel } from '@web/services/parseExcelFile';
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

/** シートの配列をフラットな PageDefinition[] に変換する */
function flattenSheets(
  sheets: readonly SheetParseOutput[],
  selectedIndices: readonly number[],
): PageDefinition[] {
  const pages: PageDefinition[] = [];
  let pageIndex = 0;

  for (const sheet of sheets) {
    if (!selectedIndices.includes(sheet.sheetIndex)) continue;

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

export function App() {
  const { file, handleFileSelect, clearFile } = useFileUpload();
  const { parseState } = useExcelParse(file);
  const layoutMode = useLayoutMode();
  const [activeMode, setActiveMode] = useState<AppMode>('upload');

  // Sheet selection state
  const [selectedSheetIndices, setSelectedSheetIndices] = useState<number[]>([]);
  const [importedPages, setImportedPages] = useState<readonly PageDefinition[]>(EMPTY_PAGES);

  const hasParseResult = parseState.status === 'success';
  const hasPages = importedPages.length > 0;

  // Build sheet info for SheetSelector
  const sheetInfoList = useMemo(() => {
    if (parseState.status !== 'success') return [];
    return parseState.result.debug.sheets.map((s, i) => {
      const sheetOutput = parseState.result.sheets[i];
      const pageCount = sheetOutput?.pages.length ?? 1;
      return {
        name: s.name,
        paperSize: paperSizeLabel(s.pageSetup.paperSize),
        orientation: s.pageSetup.orientation ?? '未設定',
        pageCount,
      };
    });
  }, [parseState]);

  // Auto-select all sheets when parse succeeds
  useEffect(() => {
    if (parseState.status === 'success') {
      const indices = parseState.result.sheets.map((s) => s.sheetIndex);
      setSelectedSheetIndices(indices);
      // Auto-import all sheets
      const pages = flattenSheets(parseState.result.sheets, indices);
      setImportedPages(pages);
      setActiveMode('preview');
    } else {
      setSelectedSheetIndices([]);
      setImportedPages(EMPTY_PAGES);
    }
  }, [parseState]);

  // Multi-page editor state
  const { activePageIndex, activePage, pages, switchPage, updatePageBoxes } =
    useMultiPageEditor(importedPages);

  // Handle re-import from SheetSelector
  const handleImport = useCallback(() => {
    if (parseState.status !== 'success') return;
    const pages = flattenSheets(parseState.result.sheets, selectedSheetIndices);
    setImportedPages(pages);
    setActiveMode('preview');
  }, [parseState, selectedSheetIndices]);

  // Handle multi-page export
  const handleExport = useCallback(() => {
    if (pages.length === 0) return;
    const templateId = file?.name.replace(/\.[^.]+$/, '') ?? 'template';
    const html = exportMultiPageAsHtml({
      pages,
      pageVariables: new Map(),
      templateId,
      templateVersion: '1.0.0',
    });
    downloadFile(html, `${templateId}.html`, 'text/html');
  }, [pages, file]);

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

  const pageTabs =
    hasPages && pages.length > 1 ? (
      <PageTabs pages={pages} activePageIndex={activePageIndex} onPageSelect={switchPage} />
    ) : null;

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
              {hasParseResult && (
                <SheetSelector
                  sheets={sheetInfoList}
                  selectedIndices={selectedSheetIndices}
                  onSelectionChange={setSelectedSheetIndices}
                  onImport={handleImport}
                  onExport={handleExport}
                  exportDisabled={!hasPages}
                  disabled={!hasParseResult}
                />
              )}
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
          {hasParseResult && (
            <SheetSelector
              sheets={sheetInfoList}
              selectedIndices={selectedSheetIndices}
              onSelectionChange={setSelectedSheetIndices}
              onImport={handleImport}
              onExport={handleExport}
              exportDisabled={!hasPages}
              disabled={!hasParseResult}
            />
          )}
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
