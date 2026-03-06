# プロジェクト進捗

> 最終更新: 2026-03-06

## スナップショット

- **全体進捗**: 18%（ExcelJS PoC 完了、ライブラリ選定確定）
- **アクティブフェーズ**: Phase 1 — Excel パーサー + プレビュー
- **ブロッカー**: なし
- **最終変動日**: 2026-03-06

## フェーズ

| # | フェーズ | 状態 | 進捗 | 最終変動 | 備考 |
|---|---------|------|------|---------|------|
| 0 | プロジェクト基盤セットアップ | done | 100% | 2026-03-06 | 完了 |
| 1 | Excel パーサー + プレビュー | active | 20% | 2026-03-06 | PoC 完了、ADR-002 で ExcelJS 採用確定。パーサー実装へ |
| 2 | 調整エディタ | not-started | 0% | — | 移動・リサイズ・分割・スナップ |
| 3 | 変数バインディングと型定義 | not-started | 0% | — | テンプレート変数 + TS interface 生成 |
| 4 | レイアウト微調整 UI | not-started | 0% | — | フォント・色・揃え・罫線設定 |

## ブロッカー

- （なし）

## 次のアクション

1. Phase 1: `src/domain/excel/` 集約の実装（ExcelJS API を使ったパーサー）
2. Phase 1: 用紙サイズ定義・座標変換ロジックの実装
3. Phase 1: .xlsx アップロード → ボックスモデル変換 → プレビュー表示

## diff

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

<details>
<summary>前回の diff（2026-03-05）</summary>

```diff
- 全体進捗: 10%
+ 全体進捗: 12%
- Phase 0 進捗: 90%
+ Phase 0 進捗: 95%（Biome CI ワークフロー追加、フロントエンド実装計画をバックログに記録）
+ バックログ 001〜004 を新規作成（フロントエンド実装計画）
+ .github/workflows/biome-ci.yml を追加（PR・push 時に Biome lint + format check + 型チェック）
```

</details>
