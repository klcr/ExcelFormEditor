# HTML 帳票テンプレート仕様書

> 外部システム連携向けドキュメント
>
> 本ドキュメントは、Excel Form Editor が出力する HTML 帳票テンプレートの仕様を定義する。
> 外部システムでテンプレートを読み込み、変数を差し替えて帳票を生成する際のリファレンスとして使用する。

## 1. 概要

Excel Form Editor は Excel (.xlsx) で作成された帳票をパースし、Web で利用可能な **HTML + CSS テンプレート** に変換する。出力される HTML は以下の 3 層構造を持つ。

| 層 | 要素 | 役割 |
|----|------|------|
| 用紙宣言 | `@page` CSS + `<section class="sheet">` | 用紙サイズ・余白・座標系を定義 |
| ボックス/線分 | `<div class="box">` / `<div class="line">` | レイアウト要素（ラベル・入力欄・罫線） |
| マニフェスト | `<script type="application/json" id="template-manifest">` | 変数マッピングとメタデータの JSON |

## 2. HTML ドキュメント構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>{templateId}</title>
  <style>
    @page { ... }
    .sheet { ... }
    .box { ... }
  </style>
</head>
<body>
  <section class="sheet" data-*="...">
    <!-- ボックス要素群 -->
    <div class="box" ...>...</div>

    <!-- 線分要素群 -->
    <div class="line" ...></div>
  </section>

  <script type="application/json" id="template-manifest">
    { ... }
  </script>
</body>
</html>
```

## 3. 座標系と単位

### 3.1 単位

すべての寸法値は **ミリメートル (mm)** で表現される。CSS でも `mm` 単位を使用する。

### 3.2 原点

座標原点は **印刷可能領域の左上** である。用紙の物理的な左上ではなく、余白を差し引いた領域の左上が `(0, 0)` となる。

```
┌────────────────── 用紙全体 ──────────────────┐
│  margin-top                                   │
│  ┌──────── 印刷可能領域 ──────────┐            │
│  │ (0,0)                          │            │
│  │   ボックス・線分はこの領域内    │            │
│  │   の相対座標で配置される        │            │
│  └────────────────────────────────┘            │
│                                    margin-right│
└───────────────────────────────────────────────┘
```

`<section>` 要素の `data-origin="printable-area"` 属性がこの座標系を明示する。

### 3.3 用紙サイズ

| サイズ | 幅 (mm) | 高さ (mm) | 備考 |
|--------|---------|-----------|------|
| A3     | 297     | 420       | portrait 基準 |
| A4     | 210     | 297       | portrait 基準 |
| A5     | 148     | 210       | portrait 基準 |

`landscape` の場合、幅と高さが入れ替わる（例: A4 landscape → 297mm × 210mm）。

## 4. `@page` CSS ルール

印刷時の用紙設定を定義する。

```css
@page {
  size: {widthMm}mm {heightMm}mm;
  margin: {topMm}mm {rightMm}mm {bottomMm}mm {leftMm}mm;
}
```

- `size`: 用紙の物理サイズ（orientation 適用後の値）
- `margin`: 用紙余白。元データは Excel のインチ単位の余白を `× 25.4` で mm 変換したもの

## 5. `<section class="sheet">` — 用紙コンテナ

### 5.1 CSS プロパティ

```css
.sheet {
  position: relative;
  width: {printableWidth}mm;
  height: {printableHeight}mm;
  overflow: hidden;
}
```

`printableWidth` / `printableHeight` は用紙サイズから上下左右の余白を差し引いた値。

### 5.2 data 属性

| 属性 | 型 | 例 | 説明 |
|------|----|----|------|
| `data-template-id` | string | `"invoice-001"` | テンプレート識別子 |
| `data-template-version` | string | `"1.0.0"` | テンプレートバージョン |
| `data-paper-size` | enum | `"A4"` | 用紙サイズ (`A3` / `A4` / `A5`) |
| `data-orientation` | enum | `"portrait"` | 用紙方向 (`portrait` / `landscape`) |
| `data-width-mm` | number | `"210"` | 用紙物理幅 (mm) |
| `data-height-mm` | number | `"297"` | 用紙物理高さ (mm) |
| `data-margin-top-mm` | number | `"25.4"` | 上余白 (mm) |
| `data-margin-right-mm` | number | `"19.1"` | 右余白 (mm) |
| `data-margin-bottom-mm` | number | `"25.4"` | 下余白 (mm) |
| `data-margin-left-mm` | number | `"19.1"` | 左余白 (mm) |
| `data-origin` | string | `"printable-area"` | 座標系の原点（常に `printable-area`） |

## 6. ボックス要素 `<div class="box">`

### 6.1 概要

帳票上の矩形領域。テキストラベル、入力フィールド、装飾枠の 3 種類の役割（role）を持つ。

### 6.2 data 属性

| 属性 | 型 | 必須 | 説明 |
|------|----|----|------|
| `data-box-id` | string | Yes | ボックスの一意識別子 |
| `data-role` | enum | Yes | `label` / `field` / `decoration` |
| `data-x-mm` | number | Yes | X 座標 (mm, 印刷可能領域原点) |
| `data-y-mm` | number | Yes | Y 座標 (mm, 印刷可能領域原点) |
| `data-w-mm` | number | Yes | 幅 (mm) |
| `data-h-mm` | number | Yes | 高さ (mm) |
| `data-variable` | string | field のみ | バインドされた変数名 |
| `data-type` | enum | field のみ | 変数の型 (`string` / `number` / `date` / `boolean`) |

### 6.3 role（役割）の分類

| role | 条件 | コンテンツ | 用途 |
|------|------|-----------|------|
| `field` | 変数がバインドされている | `{{variableName}}` | 外部システムが値を差し替える入力欄 |
| `label` | テキストがあり、変数なし | HTML エスケープ済み静的テキスト | 帳票上の固定ラベル（項目名など） |
| `decoration` | テキストなし、変数なし | 空文字列 | 装飾用枠線・背景色 |

### 6.4 変数プレースホルダー

`field` ロールのボックスは、テキストコンテンツとして `{{variableName}}` 形式のプレースホルダーを持つ。

```html
<div class="box" data-role="field" data-variable="invoiceNumber" data-type="string"
     style="...">{{invoiceNumber}}</div>
```

外部システムはこのプレースホルダーを実際の値に置換する。

### 6.5 CSS スタイル（インライン）

各ボックスの `style` 属性に以下の CSS プロパティが出力される。

#### 位置・サイズ

```css
position: absolute;
left: {x}mm;
top: {y}mm;
width: {width}mm;
height: {height}mm;
box-sizing: border-box;
```

#### 罫線

各辺が個別に定義される。存在しない辺のプロパティは省略される。

```css
border-top: {width}mm {style} {color};
border-bottom: {width}mm {style} {color};
border-left: {width}mm {style} {color};
border-right: {width}mm {style} {color};
```

**罫線スタイルのマッピング:**

| ソース値 | CSS border-style | CSS border-width |
|---------|-----------------|-----------------|
| `hair` | `solid` | `0.1mm` |
| `thin` | `solid` | `0.3mm` |
| `medium` | `solid` | `0.7mm` |
| `thick` | `solid` | `1.2mm` |
| `dotted` | `dotted` | `0.3mm` |
| `dashed` | `dashed` | `0.3mm` |
| `double` | `double` | `0.7mm` |

**色の形式:** `#RRGGBB` 形式の 16 進カラーコード。

#### フォント

```css
font-family: '{fontName}';
font-size: {sizeMm}mm;
font-weight: bold;    /* bold の場合のみ */
font-style: italic;   /* italic の場合のみ */
color: {color};
```

フォントサイズは元データの pt 値を `× 0.353` で mm に変換した値。

#### 背景色

```css
background-color: {color};  /* 塗りつぶしが定義されている場合のみ */
```

#### テキスト配置

```css
display: flex;
align-items: {verticalAlign};
text-align: {horizontalAlign};
word-wrap: break-word;  /* wrapText が有効な場合のみ */
```

**垂直配置のマッピング:**

| ソース値 | CSS align-items |
|---------|----------------|
| `top` | `flex-start` |
| `middle` | `center` |
| `bottom` | `flex-end` |

**水平配置:** `left` / `center` / `right` がそのまま `text-align` に出力される。

#### 余白（パディング）

```css
padding: {top}mm {right}mm {bottom}mm {left}mm;
/* 4辺が同値の場合はショートハンド: padding: {value}mm; */
```

パディングが未定義のボックスでは `padding` プロパティは省略される。

#### 共通

```css
overflow: hidden;  /* .box クラスで定義 */
```

## 7. 線分要素 `<div class="line">`

### 7.1 概要

帳票上の罫線を表現する要素。水平線・垂直線・斜線の 3 パターンがある。

### 7.2 data 属性

| 属性 | 型 | 説明 |
|------|-----|------|
| `data-line-id` | string | 線分の一意識別子 |
| `data-x1-mm` | number | 始点 X 座標 (mm) |
| `data-y1-mm` | number | 始点 Y 座標 (mm) |
| `data-x2-mm` | number | 終点 X 座標 (mm) |
| `data-y2-mm` | number | 終点 Y 座標 (mm) |
| `data-stroke-width-mm` | number | 線幅 (mm) |

### 7.3 CSS レンダリング

#### 水平線（dy = 0）

```css
position: absolute;
left: {minX}mm;
top: {y}mm;
width: {|dx|}mm;
height: 0;
border-top: {width}mm {style} {color};
```

#### 垂直線（dx = 0）

```css
position: absolute;
left: {x}mm;
top: {minY}mm;
width: 0;
height: {|dy|}mm;
border-left: {width}mm {style} {color};
```

#### 斜線

```css
position: absolute;
left: {startX}mm;
top: {startY}mm;
width: {length}mm;    /* sqrt(dx² + dy²) */
height: 0;
border-top: {width}mm {style} {color};
transform-origin: 0 0;
transform: rotate({angle}deg);   /* atan2(dy, dx) を度数法で */
```

### 7.4 線分スタイル

ボックスの罫線と同じスタイル・幅のマッピングを使用する（6.5 節の「罫線スタイルのマッピング」表を参照）。

## 8. テンプレートマニフェスト

HTML 末尾に埋め込まれる JSON。外部システムが変数の一覧・型情報・座標を機械的に取得するために使用する。

### 8.1 取得方法

```javascript
const el = document.getElementById('template-manifest');
const manifest = JSON.parse(el.textContent);
```

### 8.2 スキーマ

```json
{
  "templateId": "string",
  "version": "string",
  "paper": {
    "size": "A3 | A4 | A5",
    "orientation": "portrait | landscape",
    "widthMm": 210,
    "heightMm": 297,
    "margins": {
      "top": 25.4,
      "right": 19.05,
      "bottom": 25.4,
      "left": 19.05
    }
  },
  "fields": [
    {
      "variableId": "string",
      "variableName": "string",
      "variableType": "string | number | date | boolean",
      "boxId": "string",
      "region": {
        "x": 0,
        "y": 0,
        "width": 50,
        "height": 10
      },
      "absoluteRegion": {
        "x": 19.05,
        "y": 25.4,
        "width": 50,
        "height": 10
      }
    }
  ],
  "interface": "interface TemplateData {\n  invoiceNumber: string;\n  totalAmount: number;\n}\n"
}
```

### 8.3 フィールド詳細

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `templateId` | string | テンプレート識別子 |
| `version` | string | テンプレートバージョン (semver) |
| `paper` | object | 用紙情報（サイズ・方向・余白、すべて mm 単位） |
| `fields` | array | 変数バインディングの一覧 |
| `interface` | string | TypeScript インターフェース定義文字列 |

### 8.4 `fields` 配列の要素

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `variableId` | string | 変数の一意識別子 |
| `variableName` | string | 変数名（HTML 内の `{{variableName}}` と一致） |
| `variableType` | enum | 変数の型 (`string` / `number` / `date` / `boolean`) |
| `boxId` | string | 変数がバインドされたボックスの ID |
| `region` | object | 印刷可能領域内の相対座標 (mm) |
| `absoluteRegion` | object | 用紙全体に対する絶対座標 (mm) |

### 8.5 `region` と `absoluteRegion` の違い

```
absoluteRegion.x = region.x + margin-left
absoluteRegion.y = region.y + margin-top
width, height は同一
```

- `region`: 印刷可能領域の左上を原点とした座標（HTML 内の CSS 座標と一致）
- `absoluteRegion`: 用紙物理エッジの左上を原点とした座標（PDF 生成等で有用）

### 8.6 `interface` フィールド

変数定義から自動生成された TypeScript インターフェース文字列。外部システムで型安全なデータバインディングを行う際の参考情報。

**型マッピング:**

| variableType | TypeScript 型 |
|-------------|---------------|
| `string` | `string` |
| `number` | `number` |
| `date` | `Date` |
| `boolean` | `boolean` |

プロパティは変数名のアルファベット順にソートされる。

## 9. HTML エスケープ

テキストコンテンツに含まれる特殊文字は以下のルールでエスケープされる。

| 文字 | エスケープ |
|------|----------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |

## 10. 外部システム実装ガイド

### 10.1 テンプレートの読み込み

1. HTML ファイルをパースする
2. `<script id="template-manifest">` から JSON マニフェストを取得する
3. マニフェストの `fields` 配列から変数の一覧と型情報を取得する

### 10.2 変数の差し替え（レンダリング）

1. `data-role="field"` を持つすべての `<div class="box">` を走査する
2. `data-variable` 属性から変数名を取得する
3. `{{variableName}}` プレースホルダーを実際の値に置換する
4. `data-type` 属性に基づき、必要に応じて値のフォーマットを行う

```javascript
// 差し替え例
document.querySelectorAll('.box[data-role="field"]').forEach(el => {
  const varName = el.dataset.variable;
  const varType = el.dataset.type;
  const value = templateData[varName];
  el.textContent = formatValue(value, varType);
});
```

### 10.3 印刷 / PDF 出力

- `@page` CSS ルールが用紙サイズと余白を定義しているため、`window.print()` またはヘッドレスブラウザで直接 PDF 化が可能
- `.sheet` 要素のサイズが印刷可能領域に一致しているため、追加のスケーリングは不要
- すべての座標が `mm` 単位のため、印刷解像度に依存しない

### 10.4 座標を使った位置特定

マニフェストの `region` / `absoluteRegion` を使い、プログラム的にフィールド位置を参照できる。

- **`region`**: HTML/CSS 座標系と一致。DOM 操作やオーバーレイ描画に使用
- **`absoluteRegion`**: 用紙全体の座標系。PDF 直接書き込みや OCR 結果との突合に使用

## 11. 完全な出力例

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>invoice-001</title>
<style>
  @page {
    size: 210mm 297mm;
    margin: 25.4mm 19.1mm 25.4mm 19.1mm;
  }
  .sheet {
    position: relative;
    width: 171.9mm;
    height: 246.2mm;
    overflow: hidden;
  }
  .box {
    overflow: hidden;
  }
</style>
</head>
<body>
<section class="sheet"
  data-template-id="invoice-001"
  data-template-version="1.0.0"
  data-paper-size="A4"
  data-orientation="portrait"
  data-width-mm="210"
  data-height-mm="297"
  data-margin-top-mm="25.4"
  data-margin-right-mm="19.1"
  data-margin-bottom-mm="25.4"
  data-margin-left-mm="19.1"
  data-origin="printable-area">

  <div class="box"
       data-box-id="box-1"
       data-role="label"
       data-x-mm="10"
       data-y-mm="5"
       data-w-mm="40"
       data-h-mm="8"
       style="position: absolute; left: 10mm; top: 5mm; width: 40mm; height: 8mm; font-family: 'MS Gothic'; font-size: 3.53mm; color: #000000; display: flex; align-items: flex-start; text-align: left; box-sizing: border-box;">請求書番号</div>

  <div class="box"
       data-box-id="box-2"
       data-role="field"
       data-x-mm="50"
       data-y-mm="5"
       data-w-mm="60"
       data-h-mm="8"
       data-variable="invoiceNumber"
       data-type="string"
       style="position: absolute; left: 50mm; top: 5mm; width: 60mm; height: 8mm; border-bottom: 0.3mm solid #000000; font-family: 'MS Gothic'; font-size: 3.53mm; color: #000000; display: flex; align-items: flex-start; text-align: left; box-sizing: border-box;">{{invoiceNumber}}</div>

  <div class="line"
       data-line-id="line-1"
       data-x1-mm="0" data-y1-mm="20"
       data-x2-mm="171.9" data-y2-mm="20"
       data-stroke-width-mm="0.3"
       style="position: absolute; left: 0mm; top: 20mm; width: 171.9mm; height: 0; border-top: 0.3mm solid #000000;"></div>

</section>

<script type="application/json" id="template-manifest">
{
  "templateId": "invoice-001",
  "version": "1.0.0",
  "paper": {
    "size": "A4",
    "orientation": "portrait",
    "widthMm": 210,
    "heightMm": 297,
    "margins": {
      "top": 25.4,
      "right": 19.05,
      "bottom": 25.4,
      "left": 19.05
    }
  },
  "fields": [
    {
      "variableId": "var-1",
      "variableName": "invoiceNumber",
      "variableType": "string",
      "boxId": "box-2",
      "region": { "x": 50, "y": 5, "width": 60, "height": 8 },
      "absoluteRegion": { "x": 69.05, "y": 30.4, "width": 60, "height": 8 }
    }
  ],
  "interface": "interface TemplateData {\n  invoiceNumber: string;\n}\n"
}
</script>
</body>
</html>
```
