import type { BoxDefinition } from '@domain/box';
import type { PaperDefinition } from '@domain/paper';
import { PAPER_DIMENSIONS } from '@domain/paper';
import type { VariableType } from '@domain/variable';
import { generateSequentialVariables } from '@domain/variable';
import { useBoxEditor } from '@web/hooks/useBoxEditor';
import { useKeyboardShortcuts } from '@web/hooks/useKeyboardShortcuts';
import type { LayoutMode } from '@web/hooks/useLayoutMode';
import { useSnap } from '@web/hooks/useSnap';
import { useVariableEditor } from '@web/hooks/useVariableEditor';
import { useZoom } from '@web/hooks/useZoom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { MergeAction } from './BoxEditor/MergeAction';
import { SplitAction } from './BoxEditor/SplitAction';
import { CssPreview } from './CssPreview';
import { EditorCanvas } from './EditorCanvas';
import { PropertyPanel } from './PropertyPanel/PropertyPanel';

type EditorLayoutProps = {
  readonly boxes: readonly BoxDefinition[];
  readonly paper: PaperDefinition | null;
  readonly layoutMode?: LayoutMode;
  readonly onBoxesChange?: (boxes: readonly BoxDefinition[]) => void;
};

/**
 * エディタのメイン構成コンポーネント。
 * ツールバー、キャンバス、プロパティパネルを統合する。
 * デスクトップとモバイルの両レイアウトに対応。
 */
export function EditorLayout({
  boxes: initialBoxes,
  paper,
  layoutMode = 'desktop',
  onBoxesChange,
}: EditorLayoutProps) {
  const snap = useSnap();
  const { selectedBoxIds, boxes, isDragging, canUndo, canRedo, activeGuides, actions } =
    useBoxEditor(initialBoxes, { snap });
  const { variables, actions: variableActions } = useVariableEditor();
  const [isPropertySheetOpen, setIsPropertySheetOpen] = useState(false);
  const { scale, handleWheel, resetZoom } = useZoom();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        handleWheel(e);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [handleWheel]);

  const handleAssignSequentialVariables = useCallback(
    (params: {
      baseName: string;
      startIndex: number;
      type: VariableType;
      sortedBoxIds: readonly string[];
    }) => {
      const result = generateSequentialVariables({
        baseName: params.baseName,
        startIndex: params.startIndex,
        type: params.type,
        boxIds: params.sortedBoxIds,
        existingVariables: variables,
      });
      if (result.ok) {
        variableActions.addVariables(result.variables);
      }
    },
    [variables, variableActions],
  );

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
        </div>
        <div style={{ flex: 1 }}>
          <EditorCanvas
            boxes={boxes}
            selectedBoxIds={selectedBoxIds}
            isDragging={isDragging}
            activeGuides={activeGuides}
            onSelectBox={actions.selectBox}
            onToggleBoxSelection={actions.toggleBoxSelection}
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
            variables={variables}
            onAddVariable={variableActions.addVariable}
            onRemoveVariable={variableActions.removeVariable}
            onAssignSequentialVariables={handleAssignSequentialVariables}
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
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div ref={canvasContainerRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {scale !== 1.0 && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                borderRadius: 4,
                fontSize: 12,
                zIndex: 10,
              }}
            >
              <span>{Math.round(scale * 100)}%</span>
              <button
                type="button"
                onClick={resetZoom}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 3,
                  padding: '1px 6px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                リセット
              </button>
            </div>
          )}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center top',
              width: '100%',
              height: '100%',
            }}
          >
            <EditorCanvas
              boxes={boxes}
              selectedBoxIds={selectedBoxIds}
              isDragging={isDragging}
              activeGuides={activeGuides}
              onSelectBox={actions.selectBox}
              onToggleBoxSelection={actions.toggleBoxSelection}
              onDeselectAll={actions.deselectAll}
              paperWidth={paperWidth}
              paperHeight={paperHeight}
            />
          </div>
        </div>
        <div
          style={{
            width: '280px',
            borderLeft: '1px solid #ccc',
            background: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #e0e0e0',
              fontWeight: 600,
              fontSize: 13,
              color: '#555',
              flexShrink: 0,
            }}
          >
            プロパティ
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PropertyPanel
              selectedBoxIds={selectedBoxIds}
              boxes={boxes}
              onMove={actions.moveSelectedBoxes}
              onResize={actions.resizeBox}
              onUpdateBox={actions.updateBox}
              variables={variables}
              onAddVariable={variableActions.addVariable}
              onRemoveVariable={variableActions.removeVariable}
              onAssignSequentialVariables={handleAssignSequentialVariables}
            />
            <CssPreview boxes={boxes} selectedBoxIds={selectedBoxIds} />
          </div>
        </div>
      </div>
    </div>
  );
}
