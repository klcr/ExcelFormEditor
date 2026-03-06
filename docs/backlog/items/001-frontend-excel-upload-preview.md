# 001-フロントエンド: Excel アップロード & プレビュー

## 状態
完了

## 担当
Claude

## 対象パッケージ
web / domain

## 概要

.xlsx ファイルをアップロードし、ボックスモデルに変換してプレビュー表示する。
Phase 1 に対応するフロントエンド実装。

## 背景

現在の GitHub Pages デプロイはタイトルのみで機能がない。
プロジェクトの中核フローである「Excel → ボックスモデル → プレビュー」を実現する最初のステップ。

## 前提条件チェックリスト
- [x] Excel パーサー（ExcelJS or SheetJS）の選定完了
- [x] `src/domain/excel/` — Excel パーサー集約の実装
- [x] `src/domain/box/` — ボックスモデル集約の実装
- [x] `src/domain/line/` — 線分モデル集約の実装

## 実装チェックリスト

### Step A: UI シェル（ドメイン未実装でも着手可能）
- [x] `src/web/components/common/` — Layout コンポーネント（ヘッダー、サイドバー、メインエリア）
- [x] `src/web/components/upload/FileUploader.tsx` — ドラッグ＆ドロップ対応ファイル入力
- [x] `src/web/components/preview/PreviewCanvas.tsx` — SVG/Canvas ベースのプレビュー領域（モック表示）
- [x] `src/App.tsx` — ルーティングとレイアウト統合
- [x] 各コンポーネントの単体テスト

### Step B: ドメイン連携（ドメイン層の実装後）
- [x] `src/web/hooks/useExcelUpload.ts` — ファイル読み込み → ドメイン層パーサー呼び出し
- [x] `src/web/components/preview/PreviewCanvas.tsx` — ボックスモデルを SVG で描画
- [x] `src/web/components/preview/PaperView.tsx` — 用紙サイズに応じた表示スケーリング
- [x] `src/web/utils/svgHelpers.ts` — SVG 描画ユーティリティ
- [x] 統合テスト（ファイルアップロード → プレビュー表示）

## 備考

- Step A は Domain 層に依存しないため、並行開発可能
- SVG ベースの描画を推奨（印刷・拡縮との相性が良い）

## 関連ドキュメント
- `docs/constraints/001-coordinate-system.md`
- `docs/constraints/002-excel-margin-default.md`
