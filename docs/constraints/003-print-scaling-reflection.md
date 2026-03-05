# 003-印刷倍率の座標変換への反映

## 発生日
2026-03-05

## 対象レイヤー
domain

## 概要
Excelの印刷倍率（scale%）および「ページに合わせる」（fit-to-page）設定を、座標変換時に実効倍率として反映する。

## 背景
Excelの帳票は印刷時の見た目を合わせるために倍率調整（80%縮小等）や「1ページに収める」設定が多用される。これらを無視すると変換後の帳票サイズが元のExcel印刷結果と大きく異なるため、座標変換時に反映する必要がある。

## 詳細

### Excel の印刷スケーリング設定

OpenXML `<pageSetup>` の属性として格納される。scale と fitToPage は**排他的**。

| モード | XML 属性 | 値の範囲 |
|--------|---------|---------|
| scale | `scale="80"` | 10〜400（%） |
| fitToPage | `fitToWidth="1" fitToHeight="1"` | ページ数（0 = 制約なし） |

### 実効倍率（effectiveScale）の算出

#### scale モード

```
effectiveScale = scale / 100
```

例: `scale=80` → `effectiveScale = 0.8`

#### fitToPage モード

```
scaleW = printableWidth / contentTotalWidth    （fitToWidth > 0 の場合）
scaleH = printableHeight / contentTotalHeight  （fitToHeight > 0 の場合）
effectiveScale = min(scaleW, scaleH)          （両方指定の場合）
```

- `fitToWidth > 0, fitToHeight = 0` → `effectiveScale = scaleW`（横幅のみ制約）
- `fitToWidth = 0, fitToHeight > 0` → `effectiveScale = scaleH`（縦幅のみ制約）
- `fitToWidth = 0, fitToHeight = 0` → scale モードにフォールバック

※ `contentTotalWidth / contentTotalHeight` は Excel のセル範囲全体を mm 変換した値。fitToPage では倍率算出にコンテンツ範囲の事前計算が必要。

### 座標への適用

```
x_final = x_mm × effectiveScale
y_final = y_mm × effectiveScale
w_final = w_mm × effectiveScale
h_final = h_mm × effectiveScale
```

フォントサイズ等のスタイル値にも同倍率を適用する。

### フォールバック規則

| 条件 | 対応 |
|------|------|
| scale = 0 または範囲外（< 10, > 400） | effectiveScale = 1.0（100%） |
| fitToPage で算出倍率が 0.1 未満 | 0.1 にクランプ + 警告 |
| fitToPage で算出倍率が 4.0 超過 | 4.0 にクランプ + 警告 |
| scale と fitToPage の両方が設定されている | fitToPage を優先（Excel の仕様通り） |

### 変換パイプラインでの位置

```
Excel セル座標 → mm 変換 → effectiveScale 乗算 → ボックス座標 (0,0) 基準
                  ↑ 001        ↑ 003(本制約)        ↑ 002
```

## 影響範囲
- `src/domain/paper/CoordinateConverter` — 倍率計算と座標変換の実装
- `src/domain/paper/PaperTypes` — `ScalingConfig` 型の定義
- `src/domain/excel/ExcelParser` — pageSetup からの scale / fitToPage 読み出し

## 今後の対応
fitToPage で複数ページ分割が必要なケースは v1 スコープ外。将来対応する場合は本制約を拡張する。

## 状態
有効
