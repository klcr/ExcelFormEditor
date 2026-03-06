# 002-レイアウト崩れ: プレビュー表示の複合問題

## 状態
未解決

## 発生日
2026-03-06

## 概要

Excelファイルをアップロードしてプレビュー表示すると、レイアウトが大きく崩れる。
数式が生テキストで表示される、テキストが切れる、位置がズレるなど複合的な問題。

## スクリーンショットから特定した症状

### 症状A: 数式が生テキストで表示される（最重要）

- `=AB3`, `=AB6 -`, `=IF(AE...`, `=AB7` が計算結果ではなく数式文字列のまま表示
- `=AB6 → undefined` のようにresult未定義の数式が矢印付きで表示

**原因箇所**: `src/web/services/parseExcelFile.ts:72-73`

```typescript
if (typeof value === 'object' && 'formula' in value) {
    return { text: `=${value.formula} → ${value.result}`, type: 'formula' };
}
```

ExcelJSの数式オブジェクトで `value.result` が `undefined`（未計算）の場合、
`"=AB6 → undefined"` という文字列がそのまま `content` に入る。

**修正方針**: `value.result` が存在すればその値を表示、なければ空文字列またはプレースホルダ。
デバッグ表記（`=${formula} → ${result}`）は本番表示には不適切。

### 症状B: `["shar...` が繰り返し表示される

共有文字列（sharedFormula）の参照が正しく解決されていない可能性。
ExcelJSの `CellSharedFormulaValue` は `sharedFormula` プロパティを持つが、
`formatCellValue` では `'formula' in value` の分岐で一緒に処理される。

**調査ポイント**: ExcelJSの共有数式で `value.result` がどう返るか、
実際のExcelファイルでの `cell.value` のオブジェクト構造を確認する必要がある。

### 症状C: テキストの切り詰め

「工事名」→「工事:」、「機器名」→「機器:」、「購依頼」が途中で切れる。

**原因箇所**: `src/web/components/preview/PreviewCanvas.tsx:84-195`

- SVG `<clipPath>` でボックス境界外を切り取り
- `alignment.wrapText` は `BoxTypes.ts` で定義済みだが **描画に未実装**
- `fontSize` 計算: `Math.min(box.font.sizePt * 0.3528, height * 0.8)` — ボックスが狭いとフォントが極小化
- テキストが1行しか表示されず、複数行テキストの折り返しがない

### 症状D: セル参照の矢印表記

`334 →=AC34`, `336 →=AC36` のようなデバッグ表記が表示される。
これは症状Aと同根で、`formatCellValue` が数式の内部表現をデバッグ用に変換した結果。

### 症状E: ボックス位置・サイズのズレ

一部のセルがExcel上の配置と一致していない。
列幅・行高さの計算、結合セルの範囲計算に起因する可能性がある。

## データフロー（問題の全体像）

```
ExcelJS cell.value (CellFormulaValue | CellSharedFormulaValue | string | ...)
  ↓
formatCellValue() [parseExcelFile.ts:66-79]
  → 数式: `=${formula} → ${result}` (デバッグ用文字列化 ← ★ここが問題)
  → 文字列/数値: そのまま変換
  ↓
RawCell.value: string [ExcelTypes.ts]
  ↓
ExcelParser.buildBoxes() [ExcelParser.ts:370]
  → content: cell.value  ← そのまま Box に渡される
  ↓
BoxDefinition.content: string [BoxTypes.ts]
  ↓
PreviewCanvas > BoxSvg [PreviewCanvas.tsx:190]
  → <text>{box.content}</text>  ← そのまま SVG テキストとして表示
```

## 修正の優先順位

| 優先度 | 対象 | 修正内容 |
|--------|------|---------|
| **高** | 症状A,D | `formatCellValue` で数式のresultを使う。undefinedなら空文字。デバッグ表記を廃止 |
| **高** | 症状B | 共有数式(`sharedFormula`)のハンドリングを調査・修正 |
| **中** | 症状C | SVGテキスト折り返し実装、またはfontSize計算の改善 |
| **低** | 症状E | ボックス座標計算の精度改善（実ファイルとの比較が必要） |

## 次のアクションに必要なもの

1. **元のExcelファイル（.xlsx）** — ExcelJSでの `cell.value` オブジェクト構造を直接検証するため
2. **Excelで開いた状態のスクリーンショット** — 期待レイアウトとの差分比較用
3. **ブラウザコンソールログ** — パース時の警告・エラー確認

## 関連ファイル

- `src/web/services/parseExcelFile.ts` — セル値変換（formatCellValue）
- `src/domain/excel/ExcelParser.ts` — Box生成（buildBoxes）
- `src/domain/excel/ExcelTypes.ts` — RawCell型定義
- `src/domain/box/BoxTypes.ts` — BoxDefinition型定義
- `src/web/components/preview/PreviewCanvas.tsx` — SVG描画（BoxSvg）
