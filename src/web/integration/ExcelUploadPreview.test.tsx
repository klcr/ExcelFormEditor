import type { BoxDefinition } from '@domain/box';
import type { LineDefinition } from '@domain/line';
import type { PaperDefinition } from '@domain/paper';
import { createPaperDefinition } from '@domain/paper';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FullParseResult } from '@web/services/parseExcelFile';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';

// Mock the parseExcelFile service — this is the ExcelJS boundary
vi.mock('@web/services/parseExcelFile', async () => {
  const actual = await vi.importActual<typeof import('@web/services/parseExcelFile')>(
    '@web/services/parseExcelFile',
  );
  return {
    ...actual,
    parseExcelFile: vi.fn(),
  };
});

// Import the mocked function for per-test control
import { parseExcelFile } from '@web/services/parseExcelFile';
const mockParseExcelFile = vi.mocked(parseExcelFile);

function createXlsxFile(name = 'test.xlsx'): File {
  return new File(['dummy'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function buildPaper(): PaperDefinition {
  const result = createPaperDefinition({ size: 'A4', orientation: 'portrait' });
  if (!result.ok) throw new Error('Failed to create paper');
  return result.paper;
}

function buildBox(overrides: Partial<BoxDefinition> = {}): BoxDefinition {
  return {
    id: 'box-1',
    rect: { position: { x: 10, y: 20 }, size: { width: 50, height: 10 } },
    content: 'テスト値',
    border: {
      top: { style: 'thin', color: '000000' },
      bottom: { style: 'thin', color: '000000' },
      left: { style: 'thin', color: '000000' },
      right: { style: 'thin', color: '000000' },
    },
    font: { name: 'MS Gothic', sizePt: 11, bold: false, italic: false, color: '000000' },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: false },
    ...overrides,
  };
}

function buildLine(overrides: Partial<LineDefinition> = {}): LineDefinition {
  return {
    id: 'line-1',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    style: 'thin',
    color: '000000',
    ...overrides,
  };
}

function buildFullParseResult(
  paper: PaperDefinition,
  boxes: BoxDefinition[],
  lines: LineDefinition[],
): FullParseResult {
  return {
    debug: {
      fileName: 'test.xlsx',
      sheetCount: 1,
      sheets: [
        {
          name: 'Sheet1',
          pageSetup: {
            paperSize: 9,
            orientation: 'portrait',
            scale: 100,
            fitToPage: false,
            fitToWidth: undefined,
            fitToHeight: undefined,
            printArea: undefined,
            horizontalCentered: undefined,
            verticalCentered: undefined,
            headerFooter: undefined,
          },
          margins: { top: 1.0, bottom: 1.0, left: 0.75, right: 0.75, header: 0.3, footer: 0.3 },
          merges: [],
          columns: [],
          rows: [],
          cellCount: boxes.length,
          sampleCells: [],
        },
      ],
    },
    sheets: [{ sheetIndex: 0, sheetName: 'Sheet1', pages: [{ paper, boxes, lines }] }],
  };
}

/** Simulate uploading a file via the hidden file input */
function uploadFile(file: File): void {
  const input = screen.getByTestId('file-input');
  fireEvent.change(input, { target: { files: [file] } });
}

describe('Excel Upload → Preview integration', () => {
  beforeEach(() => {
    mockParseExcelFile.mockReset();
  });

  it('shows empty preview and upload prompt in initial state', () => {
    render(<App />);

    expect(screen.getByText('.xlsx ファイルをドロップ')).toBeInTheDocument();
    expect(screen.getByText('またはクリックして選択')).toBeInTheDocument();
    // Default paper renders SVG even before upload
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
  });

  it('displays parsing state then renders boxes and lines after successful parse', async () => {
    const paper = buildPaper();
    const box = buildBox({ content: '請求書' });
    const line = buildLine();
    const result = buildFullParseResult(paper, [box], [line]);

    // Delay resolution to allow checking the parsing state
    let resolvePromise: (value: FullParseResult) => void;
    const parsePromise = new Promise<FullParseResult>((resolve) => {
      resolvePromise = resolve;
    });
    mockParseExcelFile.mockReturnValue(parsePromise);

    render(<App />);
    const file = createXlsxFile();
    uploadFile(file);

    // While parsing, the debug panel shows parsing state
    await waitFor(() => {
      expect(screen.getByText('パース中...')).toBeInTheDocument();
    });

    // Resolve the parse
    // biome-ignore lint/style/noNonNullAssertion: resolvePromise is assigned in Promise constructor before use
    resolvePromise!(result);

    // After parse completes, the box text is rendered in SVG
    await waitFor(() => {
      expect(screen.getByText('請求書')).toBeInTheDocument();
    });

    // SVG should have the correct viewBox for A4 portrait
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('viewBox', '0 0 210 297');

    // Verify parseExcelFile was called with the file
    expect(mockParseExcelFile).toHaveBeenCalledWith(file);
  });

  it('renders multiple boxes and lines from parsed data', async () => {
    const paper = buildPaper();
    const boxes = [
      buildBox({ id: 'box-1', content: '品名' }),
      buildBox({
        id: 'box-2',
        content: '数量',
        rect: { position: { x: 60, y: 20 }, size: { width: 30, height: 10 } },
      }),
    ];
    const lines = [
      buildLine({ id: 'line-1', start: { x: 0, y: 30 }, end: { x: 100, y: 30 } }),
      buildLine({ id: 'line-2', start: { x: 50, y: 0 }, end: { x: 50, y: 30 } }),
    ];
    const result = buildFullParseResult(paper, boxes, lines);
    mockParseExcelFile.mockResolvedValue(result);

    render(<App />);
    uploadFile(createXlsxFile());

    await waitFor(() => {
      expect(screen.getByText('品名')).toBeInTheDocument();
      expect(screen.getByText('数量')).toBeInTheDocument();
    });

    // Verify SVG line elements exist (boxes have border lines + standalone lines)
    const svg = screen.getByRole('img');
    const svgLines = svg.querySelectorAll('line');
    // Each box with 4 borders = 4 lines * 2 boxes = 8, plus 2 standalone lines = 10
    expect(svgLines.length).toBeGreaterThanOrEqual(2);
  });

  it('shows error message when parsing fails', async () => {
    mockParseExcelFile.mockRejectedValue(new Error('ファイル形式が不正です'));

    render(<App />);
    uploadFile(createXlsxFile());

    await waitFor(() => {
      expect(screen.getByText('エラー: ファイル形式が不正です')).toBeInTheDocument();
    });
  });

  it('shows generic error for non-Error rejection', async () => {
    mockParseExcelFile.mockRejectedValue('unknown failure');

    render(<App />);
    uploadFile(createXlsxFile());

    await waitFor(() => {
      expect(screen.getByText('エラー: 不明なエラー')).toBeInTheDocument();
    });
  });

  it('resets to initial state when clear button is clicked after successful parse', async () => {
    const paper = buildPaper();
    const result = buildFullParseResult(paper, [buildBox({ content: '明細' })], []);
    mockParseExcelFile.mockResolvedValue(result);

    render(<App />);
    uploadFile(createXlsxFile('report.xlsx'));

    // Wait for parse to complete
    await waitFor(() => {
      expect(screen.getByText('明細')).toBeInTheDocument();
    });

    // File name and clear button should be visible
    expect(screen.getByText('report.xlsx')).toBeInTheDocument();
    const clearButton = screen.getByText('クリア');
    expect(clearButton).toBeInTheDocument();

    // Click clear
    fireEvent.click(clearButton);

    // Should return to upload prompt
    await waitFor(() => {
      expect(screen.getByText('.xlsx ファイルをドロップ')).toBeInTheDocument();
    });

    // The parsed content should be gone — 明細 was only in the box
    expect(screen.queryByText('明細')).not.toBeInTheDocument();
  });

  it('resets to initial state when clear button is clicked after error', async () => {
    mockParseExcelFile.mockRejectedValue(new Error('破損ファイル'));

    render(<App />);
    uploadFile(createXlsxFile());

    await waitFor(() => {
      expect(screen.getByText('エラー: 破損ファイル')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('クリア'));

    await waitFor(() => {
      expect(screen.getByText('.xlsx ファイルをドロップ')).toBeInTheDocument();
    });
    expect(screen.queryByText('エラー: 破損ファイル')).not.toBeInTheDocument();
  });

  it('can upload a new file after clearing the previous one', async () => {
    const paper = buildPaper();

    // First upload
    const result1 = buildFullParseResult(paper, [buildBox({ content: '第1回' })], []);
    mockParseExcelFile.mockResolvedValue(result1);

    render(<App />);
    uploadFile(createXlsxFile('first.xlsx'));

    await waitFor(() => {
      expect(screen.getByText('第1回')).toBeInTheDocument();
    });

    // Clear
    fireEvent.click(screen.getByText('クリア'));
    await waitFor(() => {
      expect(screen.getByText('.xlsx ファイルをドロップ')).toBeInTheDocument();
    });

    // Second upload with different data
    const result2 = buildFullParseResult(paper, [buildBox({ content: '第2回' })], []);
    mockParseExcelFile.mockResolvedValue(result2);

    uploadFile(createXlsxFile('second.xlsx'));

    await waitFor(() => {
      expect(screen.getByText('第2回')).toBeInTheDocument();
    });
    expect(screen.queryByText('第1回')).not.toBeInTheDocument();
  });

  it('renders box with fill color when present', async () => {
    const paper = buildPaper();
    const box = buildBox({
      content: '強調',
      fill: { color: 'FFFF00' },
    });
    const result = buildFullParseResult(paper, [box], []);
    mockParseExcelFile.mockResolvedValue(result);

    const { container } = render(<App />);
    uploadFile(createXlsxFile());

    await waitFor(() => {
      expect(screen.getByText('強調')).toBeInTheDocument();
    });

    // The fill rect should have the fill color
    const fillRects = container.querySelectorAll('rect[fill="#FFFF00"]');
    expect(fillRects.length).toBeGreaterThanOrEqual(1);
  });
});
