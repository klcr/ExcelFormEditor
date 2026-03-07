# 軽量 XLSX パーサー: 実装状況と不足要素

> 最終更新: 2026-03-07
> 関連 ADR: `docs/adr/003-lightweight-xlsx-parser.md`

## 概要

ExcelJS を完全に除去し、JSZip + fast-xml-parser による軽量パーサーに移行済み。
帳票変換の「80%自動・20%手動調整」方針に基づき、帳票テンプレートに必要な要素を重点的に実装。

## アーキテクチャ

```
.xlsx (zip)
  ↓ JSZip
XML files
  ↓ fast-xml-parser
JSON
  ↓ 各パーサー
RawSheetData (src/domain/excel/ExcelTypes.ts)
  ↓ ExcelParser
BoxDefinition[] + LineDefinition[]
  ↓ BoxSvg / CssGenerator
SVG プレビュー / CSS 出力
```

### パーサー構成（`src/web/services/xlsx/`）

| ファイル | 責務 | 入力 XML |
|---------|------|---------|
| `XlsxReader.ts` | エントリポイント: zip 展開→各パーサー呼び出し→`RawSheetData[]` 返却 | — |
| `WorkbookParser.ts` | シート名・シートパス・定義名（印刷領域） | `xl/workbook.xml`, `xl/_rels/workbook.xml.rels` |
| `SharedStringsParser.ts` | 共有文字列テーブル | `xl/sharedStrings.xml` |
| `StylesParser.ts` | フォント・塗り・罫線・配置・numFmts の解決 | `xl/styles.xml` |
| `ThemeParser.ts` | テーマカラーパレット抽出・tint 計算 | `xl/theme/theme1.xml` |
| `IndexedColors.ts` | OOXML 標準 64 色インデックスカラーテーブル | — |
| `NumFmtResolver.ts` | 数値フォーマット解決（日付・パーセント・桁区切り） | — |
| `SheetParser.ts` | セル・結合・行高・列幅・改ページ・ページ設定・余白・非表示行列 | `xl/worksheets/sheetN.xml` |
| `CellValueResolver.ts` | セル値の型解決（共有文字列/数値/真偽値/数式キャッシュ/numFmt適用） | — |

---

## 実装済み機能

### セルデータ

| 機能 | 状況 | 備考 |
|------|------|------|
| テキスト値 | ✅ | 共有文字列テーブル経由 |
| 数値 | ✅ | `<v>` 要素から直接取得 |
| 真偽値 | ✅ | `t="b"` → `1`/`0` を `true`/`false` に変換 |
| 数式の計算結果 | ✅ | `<f>` は無視し `<v>` のキャッシュ値を使用 |
| エラーセル | ✅ | `t="e"` → `#REF!` 等をそのまま表示 |
| インライン文字列 | ✅ | `<is><t>` および `<is><r>` リッチテキスト runs 対応 |
| セル結合 | ✅ | マスター/スレーブ解決、外周罫線収集 |

### スタイル

| 機能 | 状況 | 備考 |
|------|------|------|
| フォント名 | ✅ | `<name val="...">` |
| フォントサイズ | ✅ | `<sz val="...">` (pt) |
| 太字 | ✅ | `<b>` 要素の有無 |
| イタリック | ✅ | `<i>` 要素の有無 |
| フォント色（RGB/テーマ/インデックス） | ✅ | RGB 直指定 + テーマカラー（tint 対応）+ インデックスカラー |
| 罫線（4辺） | ✅ | top/bottom/left/right の style + color |
| 罫線スタイル | ✅ | thin/medium/thick/dotted/dashed/double/hair |
| 背景色（単色塗り） | ✅ | `patternType="solid"` の fgColor |
| 水平配置 | ✅ | left/center/right |
| 垂直配置 | ✅ | top/center→middle/bottom（OOXML "center" → BoxTypes "middle" 変換済み） |
| テキスト折り返し | ✅ | `wrapText` boolean |

### レイアウト

| 機能 | 状況 | 備考 |
|------|------|------|
| 列幅（文字単位→mm） | ✅ | `<col>` の `width` 属性 |
| 行高（pt→mm） | ✅ | `<row>` の `ht` 属性 |
| デフォルト列幅 | ✅ | `<sheetFormatPr defaultColWidth>` |
| デフォルト行高 | ✅ | `<sheetFormatPr defaultRowHeight>` |
| 用紙サイズ | ✅ | A3/A4/A5（未知は A4 フォールバック） |
| 用紙向き | ✅ | portrait/landscape |
| 印刷倍率 | ✅ | scale %、fitToPage/fitToWidth/fitToHeight |
| 余白 | ✅ | top/bottom/left/right/header/footer（インチ→mm） |
| 印刷領域 | ✅ | `definedNames` の `_xlnm.Print_Area` |
| 行改ページ | ✅ | `<rowBreaks><brk id="N">` |

### 描画（BoxSvg）

| 機能 | 状況 | 備考 |
|------|------|------|
| フォントサイズ反映 | ✅ | `sizePt * 0.3528`（pt→mm→SVG単位） |
| 太字・イタリック | ✅ | SVG `fontWeight`/`fontStyle` |
| テキスト配置 | ✅ | `textAnchor` + Y座標計算 |
| セル内改行（`\n`） | ✅ | `splitTextLines()` で明示的改行を尊重 |
| テキスト折り返し | ✅ | `wrapText` 時に幅ベースで `<tspan>` 分割 |
| 背景色 | ✅ | SVG `<rect fill>` |
| 罫線 | ✅ | SVG `<line>` with strokeWidth/strokeDasharray |

---

## 実装済み要素（バックログ完了分）

### テーマカラー / インデックスカラー ✅

- `ThemeParser.ts`: `xl/theme/theme1.xml` から 12 色のテーマカラーパレットを抽出
- `IndexedColors.ts`: OOXML 標準 64 色インデックスカラーテーブル
- `StylesParser.ts`: `extractColor()` を拡張し `theme` + `tint` + `indexed` を解決
- `XlsxReader.ts`: テーマ XML の読み込みとパレット注入

### 数値フォーマット（numFmt） ✅

- `NumFmtResolver.ts`: 組み込みフォーマット ID (0-49) + カスタム numFmt による値変換
- 日付（Excel シリアル値 → `yyyy/mm/dd`）、パーセント、桁区切りに対応
- `CellValueResolver.ts`: `numFmtId` に基づくフォーマット自動適用
- 1900/2/29 バグ補正済み

### 非表示行・列 ✅

- `SheetParser.ts`: `hidden="1"` 属性を検出し高さ/幅を 0 に設定
- `ExcelParser.ts`: 幅 0 / 高さ 0 のセルからのボックス生成をスキップ

---

## 不足要素（優先度順）

### P2: 中優先（特定の帳票で問題になる）

#### テキスト回転

- **現状**: `<alignment textRotation="N">` を無視
- **影響**: 縦書きラベル（`textRotation=255`）や斜めテキストが水平表示になる
- **対応方針**:
  1. `StylesParser` の `parseAlignment()` で `textRotation` を抽出
  2. `BoxTypes` に `rotation?: number` を追加
  3. `BoxSvg` で SVG `transform="rotate()"` を適用
  4. `CssGenerator` で `writing-mode` / `transform` を出力
- **対象ファイル**: `StylesParser.ts`、`ExcelTypes.ts`、`BoxTypes.ts`、`BoxSvg.tsx`、`CssGenerator.ts`

### P3: 低優先（エディタで手動調整可能）

| 機能 | 影響 | 備考 |
|------|------|------|
| 下線 / 取り消し線 | フォント装飾の欠落 | `<u>`, `<strike>` 要素。BoxTypes に `underline`/`strikethrough` 追加が必要 |
| インデント | 階層表示の欠落 | `<alignment indent="N">`。padding-left で代替可能 |
| 斜線罫線 | 対角線の欠落 | `<diagonal>` 要素。帳票では稀 |
| 塗りパターン | グレー網掛け等の欠落 | `patternType` が `solid` 以外。帳票では稀 |
| リッチテキスト | セル内の部分フォント | テキスト結合は済み。個別フォント反映は複雑 |
| 列改ページ | 水平方向の分割 | 制約 006 で「行改ページのみ」と決定済み |

### 対応不要

| 機能 | 理由 |
|------|------|
| 画像・図形・グラフ | ボックスモデルの範囲外 |
| 条件付き書式 | 実行時の動的スタイル。テンプレートには不要 |
| データ入力規則 | 変数バインドは GUI で設定するため不要 |
| ハイパーリンク | テンプレートに不要 |
| コメント・メモ | テンプレートに不要 |
| オートフィルタ | テンプレートに不要 |
| ウィンドウ枠固定 | 表示設定。テンプレートに不要 |
| 名前付き範囲（印刷領域以外） | 現時点で用途なし |

---

## パーサー拡張ガイド（後続エージェント向け）

### 新しいスタイルプロパティを追加する手順

1. **XML 構造を確認**: OOXML の該当要素を特定（例: `<u>` = 下線）
2. **型定義を更新**:
   - `src/domain/excel/ExcelTypes.ts` の `RawCellStyle` に追加
   - `src/domain/box/BoxTypes.ts` の `BoxFont` / `BoxAlignment` に追加
3. **パーサーを更新**: `src/web/services/xlsx/StylesParser.ts` の該当関数を拡張
4. **変換を更新**: `src/domain/excel/ExcelParser.ts` の `buildBoxes()` で新プロパティを `createBox` に渡す
5. **描画を更新**:
   - `src/web/components/common/BoxSvg.tsx` — SVG プレビュー
   - `src/domain/box/CssGenerator.ts` — CSS 出力
6. **UI を更新**: `src/web/components/editor/PropertyPanel/TextStyleSection.tsx` に編集 UI を追加
7. **テストを追加**: 各レイヤーにユニットテスト

### テーマカラー対応の具体的な実装指針

テーマカラーは P1 の最重要課題。以下の手順で実装する:

```
xl/theme/theme1.xml
  ↓ ThemeParser（新規）
ThemeColorPalette: Record<number, string>  // theme index → RGB hex
  ↓ StylesParser.extractColor() に注入
色解決: theme="N" + tint="0.5" → 最終 RGB
```

1. **`ThemeParser.ts` を新規作成**（`src/web/services/xlsx/`）
   - `<a:clrScheme>` から 12 色のテーマカラーを抽出
   - `dk1`, `lt1`, `dk2`, `lt2`, `accent1`〜`accent6`, `hlink`, `folHlink`
   - `<a:sysClr lastClr="RRGGBB">` または `<a:srgbClr val="RRGGBB">` から RGB を取得

2. **`StylesParser.ts` の `extractColor()` を拡張**
   ```typescript
   // 現在: rgb のみ
   function extractColor(node: unknown): string | undefined {
     return attrStr(node, '@_rgb')?.slice(2); // AARRGGBB → RRGGBB
   }

   // 拡張後: theme + tint 対応
   function extractColor(node: unknown, theme?: ThemeColorPalette): string | undefined {
     const rgb = attrStr(node, '@_rgb');
     if (rgb) return rgb.slice(2);

     const themeIdx = attrNum(node, '@_theme');
     if (themeIdx !== undefined && theme) {
       const baseColor = theme[themeIdx];
       const tint = attrNum(node, '@_tint');
       return tint ? applyTint(baseColor, tint) : baseColor;
     }

     const indexed = attrNum(node, '@_indexed');
     if (indexed !== undefined) return INDEXED_COLORS[indexed];

     return undefined;
   }
   ```

3. **`applyTint()` 関数**: RGB → HSL → tint 適用 → RGB に変換
   - tint > 0: 白に近づける（`lum = lum + (1 - lum) * tint`）
   - tint < 0: 黒に近づける（`lum = lum * (1 + tint)`）

4. **インデックスカラー**: OOXML 標準の 64 色テーブルをハードコード（定数配列）

5. **`XlsxReader.ts`**: `xl/theme/theme1.xml` を読み込んで `ThemeParser` に渡し、結果を `StylesParser` に注入

### 数値フォーマット対応の具体的な実装指針

1. **`StylesParser.ts`**: `<numFmts>` テーブルをパースし `numFmtId → formatCode` マップを構築
2. **組み込みフォーマット**: ID 0-49 の標準マッピングをハードコード
3. **`CellValueResolver.ts`**: `numFmtId` を受け取り、日付判定・書式適用を行う
4. **日付判定**: formatCode に `y`/`m`/`d`/`h`/`s` を含むかで簡易判定
5. **Excel シリアル値→日付変換**: `(serial - 25569) * 86400000` で UNIX タイムスタンプに変換（1900年基準、ただし 1900/2/29 のバグ考慮）

---

## テスト状況

| テストファイル | テスト数 | カバー範囲 |
|--------------|---------|-----------|
| `StylesParser.test.ts` | 15 | フォント・罫線・塗り・配置・テーマカラー・インデックスカラー・numFmts |
| `ThemeParser.test.ts` | 9 | テーマカラーパレット抽出・applyTint |
| `NumFmtResolver.test.ts` | 20 | 日付フォーマット・パーセント・桁区切り・excelSerialToDate |
| `SheetParser.test.ts` | 21 | セル・結合・行高・列幅・改ページ・ページ設定・非表示行列 |
| `SharedStringsParser.test.ts` | 8 | 共有文字列・リッチテキスト |
| `WorkbookParser.test.ts` | 4 | シート名・定義名 |
| `CellValueResolver.test.ts` | 16 | セル値の型解決 |
| `XlsxReader.test.ts` | 11 | E2E: xlsx バッファ→RawSheetData |
| `MultiPageE2E.test.ts` | 4 | 改ページ付き xlsx の E2E |
| `ExcelParser.test.ts` | 77 | RawSheetData→BoxDefinition 変換・非表示行列スキップ |

合計: **185 テスト**（パーサー関連のみ）

---

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| `docs/adr/003-lightweight-xlsx-parser.md` | ExcelJS → 軽量パーサー移行の ADR |
| `docs/adr/002-excel-parser-library-selection.md` | ExcelJS 採用時の ADR（歴史的参考） |
| `docs/issues/reports/003-exceljs-row-breaks-parse-bug.md` | ExcelJS rowBreaks バグの調査記録 |
| `docs/constraints/006-row-page-breaks-only.md` | 行改ページのみ対応の制約 |
| `docs/constraints/005-nouncheckedindexedaccess-and-exceljs-types.md` | 型安全性の制約 |
| `src/domain/excel/ExcelTypes.ts` | ドメイン型定義（RawSheetData, RawCell, RawCellStyle） |
| `src/domain/box/BoxTypes.ts` | ボックスモデル型定義 |
