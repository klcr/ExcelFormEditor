# プロジェクト進捗

> 最終更新: 2026-03-06

## スナップショット

- **全体進捗**: 40%（Phase 1 完了間近）
- **アクティブフェーズ**: Phase 1 — Excel パーサー + プレビュー
- **ブロッカー**: なし
- **最終変動日**: 2026-03-06

## フェーズ

| # | フェーズ | 状態 | 進捗 | 最終変動 | 備考 |
|---|---------|------|------|---------|------|
| 0 | プロジェクト基盤セットアップ | done | 100% | 2026-03-06 | 完了 |
| 1 | Excel パーサー + プレビュー | active | 90% | 2026-03-06 | 事象001修正、Line抽出実装、テキストクリッピング修正完了。実ファイル検証待ち |
| 2 | 調整エディタ | not-started | 0% | — | 移動・リサイズ・分割・スナップ |
| 3 | 変数バインディングと型定義 | not-started | 0% | — | テンプレート変数 + TS interface 生成 |
| 4 | レイアウト微調整 UI | not-started | 0% | — | フォント・色・揃え・罫線設定 |

## ブロッカー

- （なし）

## 既知の事象

- **事象 001**: 結合セルの罫線が適切に表示されないケースがある（`docs/issues/reports/001-merged-cell-border-display.md`）— 根本原因修正済み（結合範囲外周セルの罫線データ補完収集を追加）。実ファイルでの最終検証待ち

## 次のアクション

1. Phase 1: 実 .xlsx ファイルでのプレビュー表示検証（事象 001 修正確認含む）
2. Phase 1: バックログ 001 チェックリストの最終確認・完了
3. Phase 2: 調整エディタの設計・着手

## diff

```diff
- 全体進捗: 25%
+ 全体進捗: 40%
- Phase 1: active / 40%
+ Phase 1: active / 90%
+ 事象 001 修正: 結合セル外周スレーブの罫線データ補完収集（collectMergePerimeterCells）
+ BorderConverter テスト追加（20件）
+ LineExtractor 実装: ボックス罫線から線分を抽出・重複排除（extractLines）
+ ExcelParser に Line 抽出を統合（lines: [] → extractLines(boxes)）
+ PreviewCanvas に Line 描画追加（LineSvg コンポーネント）
+ テキストクリッピング修正: clipPath="inset(0 0 0 0)" → SVG <clipPath> + <rect>
+ 全 215 テスト パス（check-all 通過）
```

<details>
<summary>前回の diff（2026-03-06）</summary>

```diff
- 全体進捗: 18%
+ 全体進捗: 25%
- Phase 1: active / 20%（PoC 完了、パーサー実装へ）
+ Phase 1: active / 40%
+ 印刷領域（printArea）フィルタリング実装: parsePrintArea + applyPrintArea
+ 結合セル罫線収集ロジック実装: collectMergeBorder（BorderConverter.ts に分離）
+ 事象 001 登録: 結合セルの罫線が実ファイルで改善しない問題
```

</details>
