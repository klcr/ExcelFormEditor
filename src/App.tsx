import type { ParsedSheet } from '@domain/excel';
import { createPaperDefinition } from '@domain/paper';
import { AppLayout } from '@web/components/common/AppLayout';
import { Header } from '@web/components/common/Header';
import { Sidebar } from '@web/components/common/Sidebar';
import { DebugPanel } from '@web/components/debug/DebugPanel';
import { PreviewCanvas } from '@web/components/preview/PreviewCanvas';
import { FileUploader } from '@web/components/upload/FileUploader';
import { useExcelParse } from '@web/hooks/useExcelParse';
import { useFileUpload } from '@web/hooks/useFileUpload';
import './App.module.css';

const defaultPaperResult = createPaperDefinition({
  size: 'A4',
  orientation: 'portrait',
});
const defaultPaper = defaultPaperResult.ok ? defaultPaperResult.paper : null;

export function App() {
  const { file, handleFileSelect, clearFile } = useFileUpload();
  const { parseState } = useExcelParse(file);

  const firstSheet: ParsedSheet | undefined =
    parseState.status === 'success' ? parseState.result.parsed[0] : undefined;

  const paper = firstSheet?.paper ?? defaultPaper;
  const boxes = firstSheet?.boxes ?? [];
  const lines = firstSheet?.lines ?? [];

  return (
    <AppLayout
      header={<Header />}
      sidebar={
        <Sidebar>
          <FileUploader onFileSelect={handleFileSelect} acceptedFile={file} onClear={clearFile} />
        </Sidebar>
      }
      main={
        <>
          <PreviewCanvas paper={paper} boxes={boxes} lines={lines} />
          <DebugPanel parseState={parseState} />
        </>
      }
    />
  );
}
