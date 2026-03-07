# 006-行改ページのみ対応（列改ページ・自動改ページは非対応）

## 発生日
2026-03-07

## 対象レイヤー
domain / web

## 概要
シートの改ページ分割機能は、Excel で明示的に設定された**行改ページ（水平改ページ）のみ**を対象とする。以下は対象外:

1. **列改ページ（垂直改ページ）**: ExcelJS v4.4.0 が `colBreaks` を未サポートのため読み取り不可
2. **自動改ページ**: コンテンツの高さが印刷可能領域を超える場合に Excel が自動挿入するページ分割。計算にはフォントレンダリング精度が必要であり、プロジェクト方針「80%自動・20%手動」に従い対象外とする

## 詳細

### ExcelJS v4.4.0 の rowBreaks パースバグ

ExcelJS v4.4.0 には `rowBreaks` の読み取りに関するバグが3箇所存在する:

1. **`PageBreaksXform.parseOpen`** が `node.attributes.ref` を参照するが、OOXML の `<brk>` 要素は `id` 属性を持つ。結果として各ブレーク要素が `null` にパースされる
2. **`WorksheetXform.parseClose`** がモデル構築時に `rowBreaks` を含めない（414-429行目の `this.model = {...}` に未記載）
3. **`Worksheet.set model`** が `value.rowBreaks` をプロパティに反映しない

**ワークアラウンド**: JSZip（ExcelJS の間接依存）で xlsx の zip を直接解凍し、`xl/worksheets/sheetN.xml` 内の `<brk id="N">` を正規表現で読み取る。`extractRowBreaksFromZip()` 関数として `parseExcelFile.ts` に実装。

### その他の制約
- `worksheet.colBreaks` は ExcelJS に未実装（GitHub Issue #2304）

### マージセルが改ページ境界をまたぐ場合
- 各ページの行範囲にクリップして分割する
- コンテンツはマスターセルが属するページに表示される
- 視覚的な不整合が生じる場合があり、エディタでの手動調整を想定

## 影響範囲
- `src/domain/excel/PageBreakSplitter.ts` — 分割ロジック
- `src/web/services/parseExcelFile.ts` — ExcelJS からの `rowBreaks` 読み取り

## 今後の対応
- ExcelJS が `colBreaks` をサポートした場合、列改ページ対応を検討
- 自動改ページは必要性が確認された時点で別フェーズとして実装を検討
