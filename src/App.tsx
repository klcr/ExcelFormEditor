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
          <PreviewCanvas paper={defaultPaper} />
          <DebugPanel parseState={parseState} />
        </>
      }
    />
  );
}
