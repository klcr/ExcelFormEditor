# SheetJS PoC 評価レポート

> 実施日: 2026-03-06

## 目的

制約 001〜004 および X-2 で必要な情報が SheetJS (xlsx) コミュニティ版の API で取得できるかを検証する。ExcelJS PoC と同一の .xlsx バッファを読み込み、同じ検証項目で比較する。

## 検証方法

ExcelJS で生成した .xlsx バッファを SheetJS の `XLSX.read()` で読み込み（クロスリード方式）。通常読み込みと `cellStyles:true` オプション付き読み込みの両方を検証した。

## 検証結果サマリー

| # | 検証項目 | 対応制約 | 結果 | 備考 |
|---|---------|---------|------|------|
| 1 | pageMargins（6属性） | 004 | ○ | `ws['!margins']` でインチ値そのまま取得可能。 |
| 2 | pageSetup（scale / fitToPage / orientation / paperSize） | 003 | **✗** | `!pageSetup` プロパティが存在しない。Workbook.Sheets にも格納されない。 |
| 3 | 列幅（文字数単位）・行高（pt単位） | 001 | △ | **通常読み込みでは不可。`cellStyles:true` で取得可能。** |
| 4 | セル結合 | X-2 | ○ | `ws['!merges']` で `{s:{r,c}, e:{r,c}}` 配列として取得。ただし `isMerged`/`master` は存在せず、自前計算が必要。 |
| 5 | 罫線スタイル | X-2 | **✗** | `cellStyles:true` でも `cell.s` に border 情報は含まれない。`{patternType:"none"}` のみ。 |
| 6 | セル値（テキスト・数値・日付・数式） | X-2 | ○ | `cell.v`/`cell.t`/`cell.f` で全型取得可能。日付は `cellDates:true` で ISO 文字列、または `SSF.parse_date_code()` で変換。 |
| 7 | フォント情報 | — | **✗** | `cellStyles:true` でも `cell.s` に font 情報は含まれない。 |
| 8 | 背景色・塗りつぶし | — | △ | `cellStyles:true` で `cell.s.patternType` と `cell.s.fgColor.rgb` が取得可能。ただし ARGB ではなく RGB（6桁）。 |
| 9 | 印刷範囲 | — | ○ | `Workbook.Names` の `_xlnm.Print_Area` から取得可能。 |

**○: 4項目、△: 2項目、✗: 3項目**

## 読み込みオプション別の取得可否

| プロパティ | 通常読み込み | `cellStyles:true` |
|-----------|-------------|-------------------|
| `!margins` | ○ | ○ |
| `!merges` | ○ | ○ |
| `!cols` | ✗ | ○ |
| `!rows` | ✗ | ○ |
| `!ref` | ○ | ○ |
| `cell.s.border` | — | ✗ |
| `cell.s.font` | — | ✗ |
| `cell.s.patternType` / `fgColor` | — | ○ |
| `cell.s.alignment` | — | ✗ |
| `!pageSetup` | ✗ | ✗ |

## API の使いやすさ評価

### 良い点

1. **バンドルサイズが軽量**: 約 800KB（ExcelJS の約半分）。ブラウザファーストの設計。
2. **セル値の取得がシンプル**: `cell.v`（値）、`cell.t`（型）、`cell.f`（数式）の3プロパティで完結。
3. **日付変換ユーティリティ充実**: `XLSX.SSF.parse_date_code()` でシリアル値→年月日分解、`cellDates:true` で ISO 文字列取得。
4. **結合範囲の構造**: `{s:{r,c}, e:{r,c}}` オブジェクト形式で、プログラム的な走査が容易。
5. **シート列挙がシンプル**: `wb.SheetNames` 配列と `wb.Sheets` オブジェクトで直接アクセス。
6. **印刷範囲**: `Workbook.Names` の Defined Names 経由で取得可能。

### 致命的な制限

1. **pageSetup が読み取れない**: `scale`, `orientation`, `paperSize`, `fitToPage`, `fitToWidth`, `fitToHeight` のいずれも取得不可。制約 003（印刷倍率反映）の実装が不可能。
2. **罫線情報が読み取れない**: `cellStyles:true` でも `cell.s` に border 情報が含まれない。X-2（罫線スタイル対応）の実装が不可能。
3. **フォント情報が読み取れない**: font name, size, bold, italic, color のいずれも取得不可。
4. **アライメント情報が読み取れない**: horizontal, vertical の取得不可。
5. **列幅・行高に `cellStyles:true` が必須**: 通常読み込みでは `!cols`/`!rows` が undefined。

### 注意点

1. **`cellStyles:true` の `cell.s` は限定的**: patternType と fgColor のみ。border, font, alignment は含まれない。
2. **結合セルの master/slave 機能がない**: ExcelJS の `isMerged`/`cell.master` に相当する機能がなく、`!merges` 配列から自前でルックアップが必要。
3. **列幅の単位が ExcelJS と微妙に異なる**: SheetJS は `wch`（文字数 - パディング補正済み）と `width`（Excel内部単位）の2種を返す。ExcelJS の `column.width` とは値が異なる（例: 8.43 → wch=8.07）。

## 列幅の詳細比較

| 設定値 | ExcelJS `width` | SheetJS `width` | SheetJS `wch` | SheetJS `wpx` |
|--------|----------------|-----------------|---------------|---------------|
| 8.43 | 8.43 | 8.43 | 8.07 | 118 |
| 15 | 15 | 15 | 14.64 | 210 |
| 20 | 20 | 20 | 19.64 | 280 |
| 12 | 12 | 12 | 11.64 | 168 |
| 10 | 10 | 10 | 9.64 | 140 |

`width` プロパティは ExcelJS と同値。`wch` は MDW（Maximum Digit Width = 14px）に基づくパディング補正後の値。mm 変換には `width` プロパティを使用すべき。

## 行高の詳細比較

| 設定値 (pt) | ExcelJS `height` | SheetJS `hpt` | SheetJS `hpx` |
|-------------|-----------------|---------------|---------------|
| 20 | 20 | 20 | 20 |
| 15 | 15 | 15 | 15 |
| 25 | 25 | 25 | 25 |
| 18 | 18 | 18 | 18 |

行高は完全一致。`hpt`（ポイント）を使用すれば ExcelJS と同等の変換が可能。

## 背景色の詳細

`cellStyles:true` で取得できた塗りつぶし情報:

```
cell.s = { patternType: "solid", fgColor: { rgb: "FFFF00" } }
```

- `patternType`: "solid" / "none" を識別可能
- `fgColor.rgb`: 6桁 RGB（ExcelJS は 8桁 ARGB `FFFFFF00`）
- border, font, alignment は `cell.s` に含まれない

## 制約 001〜004 への適合度

| 制約 | 適合度 | 詳細 |
|------|-------|------|
| 001（mm 座標系） | △ | `cellStyles:true` 必須で列幅・行高は取得可能。`width`/`hpt` を使えば変換可能。 |
| 002（原点 = 印刷可能領域左上） | △ | margins は取得可能だが paperSize が取得できないため、用紙サイズは外部から与える必要あり。 |
| 003（印刷倍率の反映） | **✗** | **pageSetup が全く読み取れない。scale, fitToPage, orientation が取得不可。致命的。** |
| 004（余白のインチ保持） | ◎ | `ws['!margins']` がインチ値そのまま。ExcelJS と同等。 |

## 深掘り検証結果

### 検証A: 結合セルの罫線

全セル・全パターンで `cell.s.border` が undefined。コミュニティ版では結合セルの罫線挙動の検証自体が不可能。

### 検証B: pageMargins（制約004）

| 検証項目 | 結果 |
|---------|------|
| 6属性のインチ値取得 | ○ ExcelJS と同値 |
| 未設定時のデフォルト値 | ○ left/right=0.7, top/bottom=0.75, header/footer=0.3（ExcelJS と同一） |
| mm 変換の整合性 | ○ printableArea: 184.6 × 261.4 mm（ExcelJS と一致） |

### 検証C: pageSetup（制約003）

| 検証項目 | 結果 |
|---------|------|
| `!pageSetup` の存在 | **✗ 両シートとも undefined** |
| `Workbook.Sheets` にシート設定 | **✗ sheetId, name, Hidden のみ。pageSetup 情報なし** |
| scale / fitToPage の判別 | **✗ 情報が取得できないため判別不可** |
| effectiveScale の計算 | **✗ 不可** |

## ExcelJS との比較総括

| 評価軸 | ExcelJS | SheetJS CE |
|--------|---------|-----------|
| pageMargins | ◎ | ◎ |
| pageSetup (scale/fitToPage) | ◎ | **✗** |
| 列幅・行高 | ◎ | △（cellStyles 必須） |
| セル結合 | ◎（isMerged/master あり） | ○（!merges のみ） |
| 罫線 | ◎ | **✗** |
| セル値 | ◎ | ◎ |
| フォント | ◎ | **✗** |
| 背景色 | ◎ | △（patternType/fgColor のみ） |
| 印刷範囲 | ◎ | ○（Defined Names 経由） |
| アライメント | ◎ | **✗** |
| バンドルサイズ | 1.5MB | 800KB |
| ブラウザ対応 | △（polyfill 必要） | ◎（ブラウザファースト） |

## 結論

**SheetJS コミュニティ版は本プロジェクトの要件を満たさない。**

致命的な欠落:
1. **制約 003（印刷倍率）が実装不可** — pageSetup の読み取りが完全に欠落
2. **X-2（罫線スタイル）が実装不可** — border 情報が取得できない
3. **フォント情報が取得不可** — フォント名・サイズ・太字等が一切読めない
4. **アライメントが取得不可** — 水平・垂直配置が読めない

バンドルサイズの優位性（800KB vs 1.5MB）は、Web Worker 分離で ExcelJS のロードコストを軽減できるため、決定的な差にはならない。

ADR-002 の結論として **ExcelJS を採用** すべきである。SheetJS コミュニティ版では「80%自動変換」の大枠すら作れない。
