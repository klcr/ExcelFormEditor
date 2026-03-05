import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileUploader } from './FileUploader';

function createFile(name: string): File {
  return new File(['content'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('FileUploader', () => {
  it('renders drop zone when no file is accepted', () => {
    render(<FileUploader onFileSelect={vi.fn()} acceptedFile={null} onClear={vi.fn()} />);

    expect(screen.getByText('.xlsx ファイルをドロップ')).toBeInTheDocument();
    expect(screen.getByText('またはクリックして選択')).toBeInTheDocument();
  });

  it('shows file name when a file is accepted', () => {
    const file = createFile('test.xlsx');
    render(<FileUploader onFileSelect={vi.fn()} acceptedFile={file} onClear={vi.fn()} />);

    expect(screen.getByText('test.xlsx')).toBeInTheDocument();
    expect(screen.getByText('クリア')).toBeInTheDocument();
  });

  it('calls onFileSelect when a valid .xlsx file is dropped', () => {
    const onFileSelect = vi.fn();
    render(<FileUploader onFileSelect={onFileSelect} acceptedFile={null} onClear={vi.fn()} />);

    const dropZone = screen.getByRole('button');
    const file = createFile('report.xlsx');
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('rejects non-.xlsx files on drop', () => {
    const onFileSelect = vi.fn();
    render(<FileUploader onFileSelect={onFileSelect} acceptedFile={null} onClear={vi.fn()} />);

    const dropZone = screen.getByRole('button');
    const file = new File(['content'], 'image.png', {
      type: 'image/png',
    });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    const file = createFile('test.xlsx');
    render(<FileUploader onFileSelect={vi.fn()} acceptedFile={file} onClear={onClear} />);

    fireEvent.click(screen.getByText('クリア'));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
