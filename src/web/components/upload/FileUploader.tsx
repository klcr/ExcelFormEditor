import { type DragEvent, useCallback, useRef, useState } from 'react';
import styles from './FileUploader.module.css';

type FileUploaderProps = {
  readonly onFileSelect: (file: File) => void;
  readonly acceptedFile: File | null;
  readonly onClear: () => void;
};

const ACCEPTED_EXTENSION = '.xlsx';

function isValidFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION);
}

export function FileUploader({ onFileSelect, acceptedFile, onClear }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        onFileSelect(file);
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onFileSelect],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  if (acceptedFile) {
    return (
      <div className={styles.container}>
        <span className={styles.label}>ファイル</span>
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>{acceptedFile.name}</span>
          <button type="button" className={styles.clearButton} onClick={onClear}>
            クリア
          </button>
        </div>
      </div>
    );
  }

  const dropZoneClass = isDragOver
    ? `${styles.dropZone} ${styles.dropZoneDragOver}`
    : styles.dropZone;

  return (
    <div className={styles.container}>
      <span className={styles.label}>ファイル</span>
      <button
        type="button"
        className={dropZoneClass}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <span className={styles.dropZoneText}>.xlsx ファイルをドロップ</span>
        <span className={styles.dropZoneHint}>またはクリックして選択</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSION}
        className={styles.hiddenInput}
        onChange={handleInputChange}
        data-testid="file-input"
      />
    </div>
  );
}
