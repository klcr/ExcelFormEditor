# 005-テーマカラー / インデックスカラー対応

## 状態
完了

## 担当
（未定）

## 対象パッケージ
web / domain

## 概要

XLSX のテーマカラー（`<color theme="N">`）とインデックスカラー（`<color indexed="N">`）を RGB に解決し、フォント色・罫線色・背景色に反映する。

## 背景

現在の `StylesParser.extractColor()` は RGB 直指定（`<color rgb="AARRGGBB">`）のみ対応。実際の帳票の 30%以上がテーマカラーを使用しており、特にデフォルトの黒文字もテーマカラー `theme="1"` で指定されていることがある。罫線色が欠落すると帳票の枠線が表示されなくなる。

## 前提条件チェックリスト
- [x] 軽量 XLSX パーサーが動作していること
- [x] StylesParser で extractColor() が実装済みであること

## 実装チェックリスト
- [ ] `ThemeParser.ts` 新規作成: `xl/theme/theme1.xml` から 12 色のテーマパレットを抽出
- [ ] インデックスカラーテーブル: OOXML 標準 64 色をハードコード
- [ ] `applyTint()` 関数: tint 属性による明度調整（HSL 変換）
- [ ] `StylesParser.extractColor()` 拡張: theme + indexed + tint 対応
- [ ] `XlsxReader.ts` 更新: テーマ XML 読み込み→StylesParser に注入
- [ ] テスト作成: ThemeParser、extractColor 拡張、tint 計算

## 備考

詳細な実装指針は `docs/xlsx-parser-status.md` の「テーマカラー対応の具体的な実装指針」を参照。

## 関連ドキュメント
- `docs/xlsx-parser-status.md`
- `docs/constraints/007-theme-color-not-supported.md`
