import { useCallback, useState } from 'react';

type UseFileUploadReturn = {
  readonly file: File | null;
  readonly handleFileSelect: (file: File) => void;
  readonly clearFile: () => void;
};

export function useFileUpload(): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
  }, []);

  return { file, handleFileSelect, clearFile };
}
