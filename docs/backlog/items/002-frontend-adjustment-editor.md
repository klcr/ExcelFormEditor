# 002-フロントエンド: 調整エディタ

## 状態
進行中

## 担当
Claude

## 対象パッケージ
web

## 概要

変換後のボックスモデルを GUI 上で調整するエディタ。
Phase 2 に対応するフロントエンド実装。

## 背景

「80%自動・20%手動調整」方針の「手動調整」部分を担う中核機能。
自動変換で生じた位置ずれやサイズ不一致をユーザーが直感的に修正できるようにする。

## 前提条件チェックリスト
- [x] 001-frontend-excel-upload-preview が完了（Step B まで）
- [x] `src/domain/box/` — ボックスの移動・リサイズ・分割ロジック

## 実装チェックリスト

### Step A: 基本操作
- [x] `src/web/components/editor/BoxEditor/BoxOverlay.tsx` — ボックス選択 UI（クリック・矩形選択）
- [x] `src/web/components/editor/BoxEditor/DragHandle.tsx` — ドラッグ移動
- [x] `src/web/components/editor/BoxEditor/ResizeHandle.tsx` — リサイズハンドル（8方向）
- [x] `src/web/hooks/useBoxEditor.ts` — 選択・移動・リサイズの状態管理
- [x] 各コンポーネントの単体テスト

### Step B: 高度な操作
- [ ] `src/web/components/editor/SnapGuide/SnapLine.tsx` — スナップガイド線の表示
- [ ] `src/web/hooks/useSnap.ts` — スナップロジック（他ボックスの辺・グリッド）
- [ ] `src/web/components/editor/BoxEditor/SplitAction.tsx` — ボックス分割操作
- [ ] `src/web/components/editor/BoxEditor/MergeAction.tsx` — ボックス結合操作
- [ ] 操作の Undo/Redo 機能

### Step C: プロパティパネル
- [ ] `src/web/components/editor/PropertyPanel/PropertyPanel.tsx` — 選択ボックスのプロパティ表示・編集
- [ ] 位置（x, y）、サイズ（width, height）の数値入力
- [ ] 罫線スタイル（太さ・色・線種）の設定
- [ ] テキストスタイル（フォント・サイズ・揃え）の設定

## 備考

- マウスイベント処理は SVG 座標系で統一する
- スナップは近傍判定のみ（Domain 層の純粋関数で計算）

## 関連ドキュメント
- `docs/constraints/003-excel-scaling-factor.md`
