import type { BoxDefinition } from '@domain/box';
import { exportAsHtml } from '@domain/export';
import type { LineDefinition } from '@domain/line';
import type { PaperDefinition } from '@domain/paper';
import { PAPER_DIMENSIONS } from '@domain/paper';
import { useBoxEditor } from '@web/hooks/useBoxEditor';
import { useKeyboardShortcuts } from '@web/hooks/useKeyboardShortcuts';
import type { LayoutMode } from '@web/hooks/useLayoutMode';
import { useSnap } from '@web/hooks/useSnap';
import { downloadFile } from '@web/utils/downloadFile';
import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { MergeAction } from './BoxEditor/MergeAction';
import { SplitAction } from './BoxEditor/SplitAction';
import { CssPreview } from './CssPreview';
import { EditorCanvas } from './EditorCanvas';
import { PropertyPanel } from './PropertyPanel/PropertyPanel';

type EditorLayoutProps = {
  readonly boxes: readonly BoxDefinition[];
  readonly lines: readonly LineDefinition[];
  readonly paper: PaperDefinition | null;
  readonly layoutMode?: LayoutMode;
  readonly fileName?: string;
  readonly onBoxesChange?: (boxes: readonly BoxDefinition[]) => void;
};

/**
 * エディタのメイン構成コンポーネント。
 * ツールバー、キャンバス、プロパティパネルを統合する。
 * デスクトップとモバイルの両レイアウトに対応。
 */
export function EditorLayout({
  boxes: initialBoxes,
  lines,
  paper,
  layoutMode = 'desktop',
  fileName = 'template',
  onBoxesChange,
}: EditorLayoutProps) {
  const snap = useSnap();
  const { selectedBoxIds, boxes, isDragging, canUndo, canRedo, activeGuides, actions } =
    useBoxEditor(initialBoxes, { snap });
  const [isPropertySheetOpen, setIsPropertySheetOpen] = useState(false);

  // Notify parent of box changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onBoxesChange?.(boxes);
  }, [boxes, onBoxesChange]);

  useKeyboardShortcuts({
    actions: {
      undo: actions.undo,
      redo: actions.redo,
      deleteSelectedBoxes: actions.deleteSelectedBoxes,
      deselectAll: actions.deselectAll,
    },
  });

  const handleExport = () => {
    if (!paper) return;
    const templateId = fileName.replace(/\.[^.]+$/, '');
    const html = exportAsHtml({
      boxes,
      lines,
      variables: [],
      paper,
      templateId,
      templateVersion: '1.0.0',
    });
    downloadFile(html, `${templateId}.html`, 'text/html');
  };

  const paperWidth = paper
    ? paper.orientation === 'landscape'
      ? PAPER_DIMENSIONS[paper.size].height
      : PAPER_DIMENSIONS[paper.size].width
    : 210;

  const paperHeight = paper
    ? paper.orientation === 'landscape'
      ? PAPER_DIMENSIONS[paper.size].width
      : PAPER_DIMENSIONS[paper.size].height
    : 297;

  const hasSelection = selectedBoxIds.length > 0;

  if (layoutMode === 'mobile') {
    return (
      <div
        data-testid="editor-layout"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
        }}
      >
        <div
          data-testid="editor-toolbar"
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px 8px',
            borderBottom: '1px solid #ccc',
            overflow: 'auto',
          }}
        >
          <SplitAction selectedBoxIds={selectedBoxIds} boxes={boxes} onSplit={actions.splitBox} />
          <MergeAction
            selectedBoxIds={selectedBoxIds}
            boxes={boxes}
            onMerge={actions.mergeSelectedBoxes}
          />
          <button
            type="button"
            data-testid="undo-button"
            disabled={!canUndo}
            onClick={actions.undo}
          >
            ↩
          </button>
          <button
            type="button"
            data-testid="redo-button"
            disabled={!canRedo}
            onClick={actions.redo}
          >
            ↪
          </button>
          <button
            type="button"
            data-testid="export-button"
            disabled={!paper}
            onClick={handleExport}
          >
            Export
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <EditorCanvas
            boxes={boxes}
            selectedBoxIds={selectedBoxIds}
            isDragging={isDragging}
            activeGuides={activeGuides}
            onSelectBox={actions.selectBox}
            onDeselectAll={actions.deselectAll}
            paperWidth={paperWidth}
            paperHeight={paperHeight}
          />
        </div>
        {hasSelection && (
          <button
            type="button"
            data-testid="open-property-sheet"
            onClick={() => setIsPropertySheetOpen(true)}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'var(--color-accent, #2563eb)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            プロパティ
          </button>
        )}
        <BottomSheet
          isOpen={isPropertySheetOpen}
          onClose={() => setIsPropertySheetOpen(false)}
          title="プロパティ"
        >
          <PropertyPanel
            selectedBoxIds={selectedBoxIds}
            boxes={boxes}
            onMove={actions.moveSelectedBoxes}
            onResize={actions.resizeBox}
            onUpdateBox={actions.updateBox}
          />
          <CssPreview boxes={boxes} selectedBoxIds={selectedBoxIds} />
        </BottomSheet>
      </div>
    );
  }

  // Desktop layout
  return (
    <div
      data-testid="editor-layout"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div
        data-testid="editor-toolbar"
        style={{ display: 'flex', gap: '8px', padding: '8px', borderBottom: '1px solid #ccc' }}
      >
        <SplitAction selectedBoxIds={selectedBoxIds} boxes={boxes} onSplit={actions.splitBox} />
        <MergeAction
          selectedBoxIds={selectedBoxIds}
          boxes={boxes}
          onMerge={actions.mergeSelectedBoxes}
        />
        <button type="button" data-testid="undo-button" disabled={!canUndo} onClick={actions.undo}>
          元に戻す
        </button>
        <button type="button" data-testid="redo-button" disabled={!canRedo} onClick={actions.redo}>
          やり直す
        </button>
        <button type="button" data-testid="export-button" disabled={!paper} onClick={handleExport}>
          エクスポート
        </button>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <EditorCanvas
            boxes={boxes}
            selectedBoxIds={selectedBoxIds}
            isDragging={isDragging}
            activeGuides={activeGuides}
            onSelectBox={actions.selectBox}
            onDeselectAll={actions.deselectAll}
            paperWidth={paperWidth}
            paperHeight={paperHeight}
          />
        </div>
        <div style={{ width: '280px', borderLeft: '1px solid #ccc', overflow: 'auto' }}>
          <PropertyPanel
            selectedBoxIds={selectedBoxIds}
            boxes={boxes}
            onMove={actions.moveSelectedBoxes}
            onResize={actions.resizeBox}
            onUpdateBox={actions.updateBox}
          />
          <CssPreview boxes={boxes} selectedBoxIds={selectedBoxIds} />
        </div>
      </div>
    </div>
  );
}
