# プロジェクト進捗

> 最終更新: 2026-03-06

## スナップショット

- **全体進捗**: 55%（Phase 1 完了、Phase 2 着手）
- **アクティブフェーズ**: Phase 2 — 調整エディタ
- **ブロッカー**: なし
- **最終変動日**: 2026-03-06

## フェーズ

| # | フェーズ | 状態 | 進捗 | 最終変動 | 備考 |
|---|---------|------|------|---------|------|
| 0 | プロジェクト基盤セットアップ | done | 100% | 2026-03-06 | 完了 |
| 1 | Excel パーサー + プレビュー | done | 100% | 2026-03-06 | 統合テスト完了。Backlog 001 全チェック完了 |
| 2 | 調整エディタ | active | 40% | 2026-03-06 | Step A（基本操作）完了。Step B/C 未着手 |
| 3 | 変数バインディングと型定義 | not-started | 0% | — | テンプレート変数 + TS interface 生成 |
| 4 | レイアウト微調整 UI | not-started | 0% | — | フォント・色・揃え・罫線設定 |

## ブロッカー

- （なし）

## 既知の事象

- **事象 001**: 結合セルの罫線が適切に表示されないケースがある（`docs/issues/reports/001-merged-cell-border-display.md`）— 根本原因修正済み（結合範囲外周セルの罫線データ補完収集を追加）。実ファイルでの最終検証待ち
- ~~**事象 002**: `formatCellValue.test.ts` の外部ファイル依存~~ — **解決済み**: テスト計算書.xlsx をプログラム生成のフィクスチャ（見積書）に置換

## 次のアクション

1. Phase 2: Step B — スナップガイド、ボックス分割・結合、Undo/Redo
2. Phase 2: Step C — プロパティパネル（位置・サイズ・罫線・テキストスタイル）
3. Phase 3: 変数バインディングの設計・着手

## diff

```diff
# ブロッカー解消（2026-03-06）
- ブロッカー: 1 件（Lint 違反・テスト失敗で check-all 未通過）
+ ブロッカー: なし
- 全 288 テスト（285 passed / 3 failed）— check-all 未通過
+ 全 288 テスト パス — build + check-all 通過
+ noNonNullAssertion 違反 12 件を解消（?? 0 / 分割代入 / ガード節）
+ formatCellValue.test.ts: テスト計算書.xlsx 依存を除去
+ 見積書フィクスチャ（createEstimateWorkbook.ts）を追加
+ 事象 002 解決済み
```

<details>
<summary>前回の diff（2026-03-06）</summary>

```diff
# 整合性検証による修正（2026-03-06）
- 全 509 テスト パス（check-all 通過見込み）
+ 全 288 テスト（285 passed / 3 failed）— check-all 未通過
+ Lint: noNonNullAssertion 違反あり（ExcelParser.ts, parseExcelFile.ts 等）
+ テスト失敗: formatCellValue.test.ts — テスト計算書.xlsx 不在（3件）
+ 事象 002 追加: テストの外部ファイル依存
+ ブロッカー追加: check-all 未通過
+ 次のアクション先頭に check-all 修正を追加
```

</details>

<details>
<summary>前々回の diff（2026-03-06）</summary>

```diff
- 全体進捗: 40%
+ 全体進捗: 55%
- Phase 1: active / 90%
+ Phase 1: done / 100%
+ Phase 1: 統合テスト（ExcelUploadPreview.test.tsx）追加 — 9テスト
+ Backlog 001 全チェックリスト完了
- Phase 2: not-started / 0%
+ Phase 2: active / 40%
+ BoxOperations.ts 実装（moveBox, resizeBox, splitBoxH/V, snapToGrid, findNearestSnapPoints）— 35テスト
+ useBoxEditor.ts フック実装（選択・移動・リサイズ状態管理）— 8テスト
+ BoxOverlay.tsx（選択UI）、DragHandle.tsx（ドラッグ移動）、ResizeHandle.tsx（リサイズハンドル）— 18テスト
+ 全 288 テスト（285 passed / 3 failed）
```

</details>
