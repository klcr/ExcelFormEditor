# ADR-002: Excel パースライブラリ選定（ExcelJS vs SheetJS CE）

- 状態: 承認
- 日付: 2026-03-06
- 対象: Phase 1（Excel パーサー + プレビュー）

## コンテキスト

.xlsx ファイルからセル情報・スタイル・ページ設定を読み取り、ボックスモデルに変換する必要がある。候補は以下の2ライブラリ:

- **ExcelJS** (v4.4.0) — Node.js/ブラウザ両対応の Excel 操作ライブラリ
- **SheetJS CE** (xlsx) — 軽量なスプレッドシートパーサー（コミュニティ版）

両ライブラリの PoC を実施し、制約 001〜004 および X-2 の要件充足度を比較した。

## 決定

**ExcelJS を採用する。**

## 比較結果

### 機能比較

| 評価軸 | ExcelJS | SheetJS CE | 重要度 |
|--------|---------|-----------|--------|
| pageMargins（6属性） | ◎ | ◎ | 高（制約004） |
| pageSetup (scale/fitToPage/orientation/paperSize) | ◎ | **✗ 取得不可** | **致命的**（制約003） |
| 列幅（文字数単位） | ◎ | △（cellStyles 必須） | 高（制約001） |
| 行高（pt 単位） | ◎ | △（cellStyles 必須） | 高（制約001） |
| セル結合 | ◎（isMerged/master あり） | ○（!merges のみ） | 高（X-2） |
| 罫線スタイル | ◎ | **✗ 取得不可** | **致命的**（X-2） |
| セル値（テキスト・数値・日付・数式） | ◎ | ◎ | 高 |
| フォント情報 | ◎ | **✗ 取得不可** | 中 |
| 背景色・塗りつぶし | ◎ | △（patternType/fgColor のみ） | 中 |
| 印刷範囲 | ◎ | ○（Defined Names 経由） | 低 |
| アライメント | ◎ | **✗ 取得不可** | 中 |

### 非機能比較

| 評価軸 | ExcelJS | SheetJS CE |
|--------|---------|-----------|
| バンドルサイズ | ~1.5MB | ~800KB |
| ブラウザ対応 | △（polyfill 必要） | ◎（ブラウザファースト） |
| API の型安全性 | ◎（TypeScript 型定義充実） | △ |
| イテレーション API | ◎（eachRow/eachCell） | △（手動走査） |

## 根拠

### SheetJS CE の致命的欠落

1. **制約 003（印刷倍率の反映）が実装不可** — `pageSetup` が全く読み取れない。scale, fitToPage, orientation, paperSize のいずれも取得不可
2. **X-2（罫線スタイル対応）が実装不可** — `cellStyles:true` でも `cell.s` に border 情報が含まれない
3. **フォント情報が取得不可** — font name, size, bold, italic, color の全てが読めない
4. **アライメントが取得不可** — horizontal, vertical の取得不可

これらは「80%自動変換」の大枠すら作れないレベルの欠落である。

### ExcelJS のトレードオフ

- **バンドルサイズ**: SheetJS の約2倍（1.5MB vs 800KB）だが、パース処理を Web Worker に分離することで初期ロードへの影響を軽減可能
- **ブラウザ polyfill**: stream/buffer の polyfill が必要。PoC で対応済み（`vite.config.ts` に設定追加）
- **全9検証項目で問題なし**: 制約 001〜004 の全てに◎適合

### SheetJS Pro について

SheetJS Pro（有償版）では罫線・フォント等の追加機能が利用可能とされるが、ライセンスコストが発生し、OSS プロジェクトとしての採用ハードルが高い。ExcelJS は MIT ライセンスで全機能が利用可能。

## PoC の詳細

### ExcelJS PoC

- ブランチ: `claude/exceljs-poc-eRnPX`
- テスト: 全パス
- レポート: `poc/exceljs/REPORT.md`
- 検証内容: 制約 001〜004 の全検証項目 + 結合セル罫線・pageMargins・pageSetup の深掘り検証

### SheetJS PoC

- ブランチ: `claude/sheetjs-poc-9TqUw`
- テスト: 全47テストパス
- レポート: `poc/sheetjs/REPORT.md`
- 検証内容: ExcelJS と同一の .xlsx バッファを SheetJS で読み込み（クロスリード方式）、同一検証項目で比較

### 列幅の単位比較

| 設定値 | ExcelJS `width` | SheetJS `width` | SheetJS `wch` |
|--------|----------------|-----------------|---------------|
| 8.43 | 8.43 | 8.43 | 8.07 |
| 15 | 15 | 15 | 14.64 |
| 20 | 20 | 20 | 19.64 |

ExcelJS の `column.width`（文字単位）を既存の `CoordinateConverter.excelColumnWidthToMm()` で mm 変換する方式を継続する。

## 影響範囲

- Phase 1 の Excel パーサー実装は ExcelJS API を前提とする
- `src/domain/excel/` 集約の型定義は ExcelJS のデータ構造に基づく
- Web Worker でのパース処理設計（バンドルサイズ対策）

## 参考

- [ExcelJS GitHub](https://github.com/exceljs/exceljs)
- [SheetJS CE Documentation](https://docs.sheetjs.com/)
- 制約 001〜004: `docs/constraints/`
