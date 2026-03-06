import type { ParsedSheet } from '@domain/excel';
import { createPaperDefinition } from '@domain/paper';
import { AppLayout } from '@web/components/common/AppLayout';
import { Header } from '@web/components/common/Header';
import { Sidebar } from '@web/components/common/Sidebar';
import { DebugPanel } from '@web/components/debug/DebugPanel';
import { EditorLayout } from '@web/components/editor/EditorLayout';
import { PreviewCanvas } from '@web/components/preview/PreviewCanvas';
import { FileUploader } from '@web/components/upload/FileUploader';
import { useExcelParse } from '@web/hooks/useExcelParse';
import { useFileUpload } from '@web/hooks/useFileUpload';
import { useState } from 'react';
import './App.module.css';

const defaultPaperResult = createPaperDefinition({
  size: 'A4',
  orientation: 'portrait',
});
const defaultPaper = defaultPaperResult.ok ? defaultPaperResult.paper : null;

export function App() {
  const { file, handleFileSelect, clearFile } = useFileUpload();
  const { parseState } = useExcelParse(file);
  const [isEditorMode, setIsEditorMode] = useState(false);

  const firstSheet: ParsedSheet | undefined =
    parseState.status === 'success' ? parseState.result.parsed[0] : undefined;

  const paper = firstSheet?.paper ?? defaultPaper;
  const boxes = firstSheet?.boxes ?? [];
  const lines = firstSheet?.lines ?? [];

  const hasParseResult = parseState.status === 'success';

  return (
    <AppLayout
      header={<Header />}
      sidebar={
        <Sidebar>
          <FileUploader onFileSelect={handleFileSelect} acceptedFile={file} onClear={clearFile} />
          {hasParseResult && !isEditorMode && (
            <button type="button" data-testid="edit-button" onClick={() => setIsEditorMode(true)}>
              編集
            </button>
          )}
          {isEditorMode && (
            <button
              type="button"
              data-testid="preview-button"
              onClick={() => setIsEditorMode(false)}
            >
              プレビュー
            </button>
          )}
        </Sidebar>
      }
      main={
        isEditorMode ? (
          <EditorLayout paper={paper} boxes={boxes} lines={lines} />
        ) : (
          <>
            <PreviewCanvas paper={paper} boxes={boxes} lines={lines} />
            <DebugPanel parseState={parseState} />
          </>
        )
      }
    />
  );
}
