# 004-Excel余白の読み出しと保持

## 発生日
2026-03-05

## 対象レイヤー
domain

## 概要
Excelの `<pageMargins>` から6種の余白（top, bottom, left, right, header, footer）をインチ単位で読み出し、`PaperDefinition` にそのまま保持する。mm への変換は利用時に行う。

## 背景
Excel帳票の余白設定は印刷結果に直接影響する。余白を正しく読み出すことで、印刷可能領域のサイズを正確に算出でき、座標原点（制約 002）の位置が確定する。また、CSS 出力時に正確なオフセットを加算できる。

## 詳細

### Excel の pageMargins 構造

OpenXML `xl/worksheets/sheet1.xml` に格納:

```xml
<pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.3" footer="0.3"/>
```

全属性はインチ（小数）で格納される。

### 6 種の余白

| 属性 | 説明 | Excelデフォルト値 |
|------|------|-----------------|
| `top` | 用紙上端からコンテンツ領域上端までの距離 | 1.0" (25.4mm) |
| `bottom` | 用紙下端からコンテンツ領域下端までの距離 | 1.0" (25.4mm) |
| `left` | 用紙左端からコンテンツ領域左端までの距離 | 0.75" (19.05mm) |
| `right` | 用紙右端からコンテンツ領域右端までの距離 | 0.75" (19.05mm) |
| `header` | 用紙上端からヘッダー領域までの距離 | 0.3" (7.62mm) |
| `footer` | 用紙下端からフッター領域までの距離 | 0.3" (7.62mm) |

### 格納方針

- **保持単位: インチ**（Excelの原本値をそのまま格納）
- **理由**: 丸め誤差を最小限にするため、変換は利用時に1回だけ行う
- **mm 変換**: `marginMm = marginInches × 25.4`

### 型定義

```typescript
type Margins = {
  top: number;      // inches
  bottom: number;   // inches
  left: number;     // inches
  right: number;    // inches
  header: number;   // inches
  footer: number;   // inches
};
```

### デフォルト値

Excel が pageMargins を出力しない場合、または属性が欠落している場合に適用:

```typescript
const DEFAULT_MARGINS: Margins = {
  top: 1.0,
  bottom: 1.0,
  left: 0.75,
  right: 0.75,
  header: 0.3,
  footer: 0.3,
};
```

### 印刷可能領域の算出

```
printableWidth  = paperWidth  - (margins.left + margins.right) × 25.4
printableHeight = paperHeight - (margins.top + margins.bottom) × 25.4
```

例: A4 portrait (210×297mm) + デフォルト余白:
- `printableWidth  = 210 - (0.75 + 0.75) × 25.4 = 210 - 38.1 = 171.9mm`
- `printableHeight = 297 - (1.0 + 1.0) × 25.4 = 297 - 50.8 = 246.2mm`

### バリデーション

| 条件 | 対応 |
|------|------|
| 各余白が負の値 | デフォルト値にフォールバック |
| 印刷可能領域の幅または高さが 0 以下 | バリデーションエラーを返す |
| pageMargins 要素が存在しない | 全属性にデフォルト値を適用 |
| 一部属性のみ欠落 | 欠落属性のみデフォルト値を適用 |

### header / footer 余白の扱い

v1 ではヘッダー/フッター領域の描画は対象外とする。ただし値は読み出して `Margins` に保持し、将来の拡張に備える。

## 影響範囲
- `src/domain/paper/PaperTypes` — `Margins` 型、`PaperDefinition` 型の定義
- `src/domain/paper/Paper` — 印刷可能領域の算出、バリデーション
- `src/domain/excel/ExcelParser` — `<pageMargins>` の読み出し

## 今後の対応
- ヘッダー/フッター領域への対応は Phase 2 以降で検討
- カスタム余白のエディタ上での変更機能は Phase 4 で検討

## 状態
有効
