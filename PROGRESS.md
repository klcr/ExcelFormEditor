# プロジェクト進捗

> 最終更新: 2026-03-06

## スナップショット

- **全体進捗**: 25%（Excel パーサー実装進行中）
- **アクティブフェーズ**: Phase 1 — Excel パーサー + プレビュー
- **ブロッカー**: なし（事象 001 は継続調査中だが進行をブロックしていない）
- **最終変動日**: 2026-03-06

## フェーズ

| # | フェーズ | 状態 | 進捗 | 最終変動 | 備考 |
|---|---------|------|------|---------|------|
| 0 | プロジェクト基盤セットアップ | done | 100% | 2026-03-06 | 完了 |
| 1 | Excel パーサー + プレビュー | active | 40% | 2026-03-06 | 印刷領域フィルタリング実装済み。罫線収集ロジック追加済み（事象001あり） |
| 2 | 調整エディタ | not-started | 0% | — | 移動・リサイズ・分割・スナップ |
| 3 | 変数バインディングと型定義 | not-started | 0% | — | テンプレート変数 + TS interface 生成 |
| 4 | レイアウト微調整 UI | not-started | 0% | — | フォント・色・揃え・罫線設定 |

## ブロッカー

- （なし）

## 既知の事象

- **事象 001**: 結合セルの罫線が適切に表示されないケースがある（`docs/issues/reports/001-merged-cell-border-display.md`）

## 次のアクション

1. Phase 1: 事象 001 の原因調査・修正（結合セル罫線の表示問題）
2. Phase 1: .xlsx アップロード → ボックスモデル変換 → プレビュー表示の精度向上
3. Phase 1: 線分（Line）モデルへの罫線抽出

## diff

```diff
- 全体進捗: 18%
+ 全体進捗: 25%
- Phase 1: active / 20%（PoC 完了、パーサー実装へ）
+ Phase 1: active / 40%
+ 印刷領域（printArea）フィルタリング実装: parsePrintArea + applyPrintArea
+ 結合セル罫線収集ロジック実装: collectMergeBorder（BorderConverter.ts に分離）
+ 事象 001 登録: 結合セルの罫線が実ファイルで改善しない問題
```

<details>
<summary>前回の diff（2026-03-06）</summary>

```diff
- 全体進捗: 12%
+ 全体進捗: 18%
- Phase 0: active / 95%
+ Phase 0: done / 100%
- Phase 1: not-started / 0%
+ Phase 1: active / 20%（ExcelJS PoC + SheetJS PoC 完了）
+ ADR-002 作成: ExcelJS 採用を決定（SheetJS CE は制約003・X-2 が実装不可）
+ ExcelJS PoC: 全9検証項目パス（制約001〜004 全て◎）
+ SheetJS PoC: 全47テストパス。pageSetup/罫線/フォントが取得不可で不採用
```

</details>
