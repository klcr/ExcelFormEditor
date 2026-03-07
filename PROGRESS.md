# プロジェクト進捗

> 最終更新: 2026-03-07

## スナップショット

- **全体進捗**: 100%（Phase 1-5 全完了 + マルチシート対応追加）
- **アクティブフェーズ**: なし（全フェーズ完了）
- **ブロッカー**: なし
- **最終変動日**: 2026-03-07

## フェーズ

| # | フェーズ | 状態 | 進捗 | 最終変動 | 備考 |
|---|---------|------|------|---------|------|
| 0 | プロジェクト基盤セットアップ | done | 100% | 2026-03-06 | 完了 |
| 1 | Excel パーサー + プレビュー | done | 100% | 2026-03-06 | 統合テスト完了。Backlog 001 全チェック完了 |
| 2 | 調整エディタ | done | 100% | 2026-03-06 | Step A/B/C 全完了。EditorLayout統合済み |
| 3 | 変数バインディングと型定義 | done | 100% | 2026-03-06 | Variable集約、VariableBindingSection、InterfacePreview、VariableListPanel |
| 4 | レイアウト微調整 UI | done | 100% | 2026-03-07 | PaddingSection、PropertyPanel全セクション統合、3層HTML エクスポート機能完了 |
| 5 | UI動線整理 + レスポンシブ対応 | done | 100% | 2026-03-06 | useLayoutMode, BottomSheet, BottomNav, AppLayout/EditorLayoutレスポンシブ化, CssPreview統合 |
| 6 | マルチシート対応 | done | 100% | 2026-03-07 | シート選択・ページタブ・ページ切替・マルチページエクスポート |

## ブロッカー

- （なし）

## 既知の事象

- **事象 001**: 結合セルの罫線が適切に表示されないケースがある（`docs/issues/reports/001-merged-cell-border-display.md`）— 根本原因修正済み（結合範囲外周セルの罫線データ補完収集を追加）。実ファイルでの最終検証待ち
- **事象 002**: レイアウト崩れ: プレビュー表示の複合問題（`docs/issues/reports/002-layout-rendering-issues.md`）— 症状 A,B,C,D 修正済み。**症状 E（ボックス位置・サイズのズレ）は未対応**（実 Excel との比較が必要）

## 次のアクション

1. **Backlog 005: テーマカラー対応**（P1 最優先）— 帳票の色再現に最も影響が大きい
2. **Backlog 006: 数値フォーマット対応**（P2）— 日付・通貨・パーセントの表示
3. **Backlog 007: 非表示行・列の対応**（P2）— レイアウト崩れ防止
4. 事象 002 症状 E（ボックス位置ズレ）— 実 Excel ファイル提供後に調査
5. `/project:review` で設計レビュー実施

詳細な実装指針と不足要素の分析は `docs/xlsx-parser-status.md` を参照。

## diff

```diff
# 軽量 XLSX パーサー品質改善 + ドキュメント整備（2026-03-07）
+ fix: OOXML vertical="center" → BoxTypes "middle" マッピング追加
+ fix: BoxSvg でセル内改行（\n）を行分割するよう修正
+ docs: ADR-003 軽量パーサー移行の意思決定記録を追加
+ docs: xlsx-parser-status.md — 実装状況・不足要素・拡張ガイドを作成
+ docs: Backlog 005/006/007 — テーマカラー / 数値フォーマット / 非表示行列を追加
+ docs: 制約 007 — テーマカラー未対応の制約を記録
+ 全562テスト パス — build + check-all 通過
```

<details>
<summary>前回の diff（2026-03-07: マルチシート対応）</summary>

```diff
# マルチシート対応（2026-03-07）
+ Phase 6: done / 100% — マルチシート対応
+ domain/page 集約新規作成: PageDefinition 型、prefixPageIds() で ID 一意性保証
+ domain/export 拡張: exportMultiPageAsHtml(), generateMultiPageManifest()
+ ExportTypes: PageManifestEntry, MultiPageTemplateManifest 型追加
+ SheetSelector コンポーネント: サイドバーにシート選択チェックリスト表示
+ PageTabs コンポーネント: プレビュー・編集モードでページ切替タブ（1ページ時は非表示）
+ useMultiPageEditor フック: ページ別ボックス状態管理
+ EditorLayout: onBoxesChange コールバック追加（key によるリマウント方式でUndo履歴リセット）
+ App.tsx: 全シート自動インポート + シート選択UI + ページ切替統合
+ 全522テスト パス — build + check-all 通過
```

</details>

<details>
<summary>前々回の diff（2026-03-07: Phase 4 完了）</summary>

```diff
# Phase 4 完了 — PaddingSection + PropertyPanel統合 + エクスポート機能（2026-03-07）
- 全体進捗: 92%
+ 全体進捗: 100%
- Phase 4: active / 80%
+ Phase 4: done / 100%
+ useBoxEditor: updateBox アクション追加（部分更新対応）
+ PropertyPanel: 全6セクション統合（PositionSize/Border/TextStyle/Fill/Padding/VariableBinding）
+ PaddingSection: 上下左右パディング設定 UI（mm単位）
+ Domain BoxTypes: BoxPadding 型追加、CssGenerator padding CSS 出力対応
+ Domain export 集約新規作成: ExportTypes, RoleClassifier, ManifestGenerator, TemplateExporter
+ 3層 HTML エクスポート: 用紙宣言 + ボックス/線分意味付け + JSON マニフェスト
+ EditorLayout: エクスポートボタン追加（HTML ダウンロード機能）
+ Backlog 003/004 完了、全バックログ項目完了
+ 全498テスト パス
```

</details>

<details>
<summary>前々回の diff（2026-03-06: UI動線整理 + レスポンシブ対応）</summary>

```diff
# UI動線整理 + レスポンシブ対応（2026-03-06）
- 全体進捗: 90%
+ 全体進捗: 92%
+ Phase 5: done / 100% — UI動線整理 + レスポンシブ対応
+ useLayoutMode フック: 画面比率（orientation）でデスクトップ/モバイル自動切替
+ BottomSheet / BottomNav 共通コンポーネント新規作成
+ AppLayout: layoutMode prop追加、モバイル時サイドバー非表示+BottomNav表示
+ EditorLayout: モバイル対応（BottomSheet内PropertyPanel）+ CssPreview統合
+ App.tsx: 3モード動線（アップロード/プレビュー/編集）、SegmentedControl風モード切替
+ 全31新規テスト パス（5テストファイル追加/更新）
```

</details>

<details>
<summary>前々々回の diff（2026-03-06: Wave 0-3 並列実装）</summary>

```diff
# Wave 0-3 並列エージェント実装（2026-03-06）
- 全体進捗: 55%
+ 全体進捗: 90%
- Phase 2: active / 40%（Step A 完了、Step B/C 未着手）
+ Phase 2: done / 100%（Step A/B/C 全完了、EditorLayout統合済み）
- Phase 3: not-started / 0%
+ Phase 3: done / 100%（Variable集約、VariableBindingSection、InterfacePreview）
- Phase 4: not-started / 0%
+ Phase 4: active / 80%（Border/Text/Fill/CSSジェネレータ完了、残: Padding/エクスポート）
+ Wave 0: useBoxEditor拡張（Undo/Redo, Snap, Split/Merge, Delete統合）
+ Wave 1: EditorCanvas, SplitAction/MergeAction, PropertyPanel基盤, Variable集約
+ Wave 2: KeyboardShortcuts, BorderSection/TextStyleSection, VariableBindingSection/VariableListPanel/InterfacePreview
+ Wave 3: EditorLayout統合, App.tsxモード切替, CssGenerator, FillSection, CssPreview
+ 全445テスト パス（41テストファイル）— build + check-all 通過
```

</details>

<details>
<summary>過去の diff（2026-03-06: 整合性検証 + ブロッカー解消 + Phase 1→2 進捗）</summary>

```diff
# 整合性検証による修正（2026-03-06）
- 事象 002: `formatCellValue.test.ts` の外部ファイル依存（解決済み）
+ 事象 002: レイアウト崩れ: プレビュー表示の複合問題（症状A,B,C,D修正済み、症状E未対応）

# ブロッカー解消（2026-03-06）
- ブロッカー: 1 件（Lint 違反・テスト失敗で check-all 未通過）
+ ブロッカー: なし
+ noNonNullAssertion 違反 12 件を解消
+ formatCellValue.test.ts: テスト計算書.xlsx 依存を除去

# Phase 1→2 進捗（2026-03-06）
- 全体進捗: 40%
+ 全体進捗: 55%
+ Phase 1: done / 100%
+ Phase 2: active / 40%
+ BoxOperations.ts, useBoxEditor.ts, BoxOverlay/DragHandle/ResizeHandle 実装
```

</details>
