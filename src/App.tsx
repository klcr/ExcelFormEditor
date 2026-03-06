import type { ParsedSheet } from '@domain/excel';
import { createPaperDefinition } from '@domain/paper';
import { AppLayout } from '@web/components/common/AppLayout';
import { BottomNav } from '@web/components/common/BottomNav';
import { Header } from '@web/components/common/Header';
import { Sidebar } from '@web/components/common/Sidebar';
import { DebugPanel } from '@web/components/debug/DebugPanel';
import { EditorLayout } from '@web/components/editor/EditorLayout';
import { PreviewCanvas } from '@web/components/preview/PreviewCanvas';
import { FileUploader } from '@web/components/upload/FileUploader';
import { useExcelParse } from '@web/hooks/useExcelParse';
import { useFileUpload } from '@web/hooks/useFileUpload';
import { useLayoutMode } from '@web/hooks/useLayoutMode';
import { useState } from 'react';
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

export function App() {
  const { file, handleFileSelect, clearFile } = useFileUpload();
  const { parseState } = useExcelParse(file);
  const layoutMode = useLayoutMode();
  const [activeMode, setActiveMode] = useState<AppMode>('upload');

  const firstSheet: ParsedSheet | undefined =
    parseState.status === 'success' ? parseState.result.parsed[0] : undefined;

  const paper = firstSheet?.paper ?? defaultPaper;
  const boxes = firstSheet?.boxes ?? [];
  const lines = firstSheet?.lines ?? [];

  const hasParseResult = parseState.status === 'success';

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    disabled: item.id !== 'upload' && !hasParseResult,
  }));

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
            </div>
          );
        case 'preview':
          return <PreviewCanvas paper={paper} boxes={boxes} lines={lines} />;
        case 'editor':
          return <EditorLayout paper={paper} boxes={boxes} lines={lines} layoutMode="mobile" />;
      }
    }

    if (activeMode === 'editor') {
      return <EditorLayout paper={paper} boxes={boxes} lines={lines} layoutMode="desktop" />;
    }
    return (
      <>
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
