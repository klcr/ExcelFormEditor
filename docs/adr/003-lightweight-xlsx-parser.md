# ADR-003: 軽量 XLSX パーサーへの移行（ExcelJS 置き換え）

- 状態: 承認
- 日付: 2026-03-07
- 対象: Excel パーサー基盤

## コンテキスト

ADR-002 で採用した ExcelJS v4.4.0 には以下の課題が蓄積した:

1. **rowBreaks の 3 箇所連鎖バグ**（事象 003）— パース・モデル構築・プロパティ反映の各層にバグがあり、改ページ情報が全く取得できない
2. **バンドルサイズ**: ~1.5MB + polyfill（stream/buffer）
3. **ESM/CJS 混在問題**: Vite 環境でモンキーパッチ不可
4. **ブラックボックス性**: 内部パイプラインの挙動を制御できず、バグ発見→修正のサイクルが困難

一方、事象 003 の回避策として JSZip + fast-xml-parser による直接 XML 解析を実施し、この方式が十分実用的であることが実証された。

## 決定

**ExcelJS を完全に除去し、JSZip + fast-xml-parser による軽量パーサーに置き換える。**

## 実装構成

```
src/web/services/xlsx/
├── XlsxReader.ts          # エントリポイント: zip展開→各パーサー呼び出し
├── WorkbookParser.ts       # xl/workbook.xml: シート名・定義名
├── SharedStringsParser.ts  # xl/sharedStrings.xml: 共有文字列テーブル
├── StylesParser.ts         # xl/styles.xml: フォント・塗り・罫線・配置
├── SheetParser.ts          # xl/worksheets/sheetN.xml: セル・結合・行高・列幅
└── CellValueResolver.ts    # セル値の型解決（共有文字列/数値/真偽値/数式結果）
```

### 依存ライブラリ

| ライブラリ | 用途 | サイズ |
|-----------|------|--------|
| JSZip | xlsx（zip）展開 | ~128KB |
| fast-xml-parser | XML → JSON 変換 | ~50KB |

**ExcelJS（~1.5MB + polyfill）を完全除去。** バンドルサイズが約 1/8 に削減。

## 根拠

### ExcelJS の課題

- rowBreaks バグ（事象 003）の回避に JSZip 直接解析を既に導入済みで、ExcelJS と並行して同じ zip を二重に読む冗長性があった
- 帳票変換に不要な機能（書き込み、ストリーミング、テンプレート機能等）がバンドルに含まれる
- polyfill（stream/buffer）が Vite 設定を複雑化

### 軽量パーサーの利点

1. **透明性**: OOXML の XML 構造を直接扱うため、パースの挙動を完全に制御できる
2. **デバッグ容易性**: 問題発生時に XML の該当箇所を即座に特定可能
3. **拡張容易性**: テーマカラーやフォーマット等の追加対応が、XML 要素の読み取り追加だけで実現可能
4. **バンドル削減**: 約 180KB（JSZip + fast-xml-parser）vs 約 1.5MB+（ExcelJS + polyfill）

### トレードオフ

- **自前パース**: OOXML 仕様の理解が必要。ただし帳票変換に必要な要素は限定的
- **テスト責務**: ExcelJS が担っていた正常性保証を自前テストで担保する必要がある

## 影響範囲

- `src/web/services/xlsx/` — 全ファイル新規実装
- `src/web/services/parseExcelFile.ts` — ExcelJS 依存を除去、XlsxReader に差し替え
- `vite.config.ts` — stream/buffer polyfill の除去
- `package.json` — ExcelJS 依存の除去

## 参考

- 事象 003: `docs/issues/reports/003-exceljs-row-breaks-parse-bug.md`
- ADR-002: `docs/adr/002-excel-parser-library-selection.md`（ExcelJS 採用時の判断）
