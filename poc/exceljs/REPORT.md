# ExcelJS PoC 評価レポート

> 実施日: 2026-03-06

## 目的

制約 001〜004 および X-2 で必要な情報が ExcelJS の API で素直に取得できるかを検証する。

## 検証結果サマリー

| # | 検証項目 | 対応制約 | 結果 | 備考 |
|---|---------|---------|------|------|
| 1 | pageMargins（6属性） | 004 | ○ | `sheet.pageSetup.margins` で直接アクセス可能。インチ値そのまま取得。 |
| 2 | pageSetup（scale / fitToPage / orientation / paperSize） | 003 | ○ | `sheet.pageSetup` に明示的なプロパティとして存在。型も明快。 |
| 3 | 列幅（文字数単位）・行高（pt単位） | 001 | ○ | `column.width`（文字数）、`row.height`（pt）で取得。 |
| 4 | セル結合 | X-2 | ○ | `sheet.model.merges` で範囲文字列配列として取得。`cell.isMerged` / `cell.master` で結合元の参照も可能。 |
| 5 | 罫線スタイル | X-2 | ○ | `cell.border.{top,bottom,left,right}` に `style` と `color.argb` が格納。thin / double / dashed 等を識別可能。 |
| 6 | セル値（テキスト・数値・日付・数式） | X-2 | ○ | 文字列・数値・Date オブジェクトで直接取得。数式は `{ formula, result }` オブジェクト形式。 |
| 7 | フォント情報 | — | ○ | `cell.font` に name / size / bold / italic / color.argb が格納。 |
| 8 | 背景色・塗りつぶし | — | ○ | `cell.fill` にパターン種別と色情報が格納。`fgColor.argb` で色を取得。 |
| 9 | 印刷範囲 | — | ○ | `sheet.pageSetup.printArea` で文字列として取得。 |

**全9項目すべて ○（問題なく取得可能）**

## API の使いやすさ評価

### 良い点

1. **pageSetup の型が明快**: `sheet.pageSetup.scale`, `.fitToPage`, `.fitToWidth`, `.fitToHeight`, `.orientation`, `.paperSize` がそれぞれ独立したプロパティとして存在。制約 003 / 004 の読み出しが非常にストレートフォワード。

2. **margins が直感的**: `sheet.pageSetup.margins.{top,bottom,left,right,header,footer}` でインチ値を直接取得。SheetJS の `!margins` 経由よりも発見しやすい。

3. **セル結合の扱いが充実**: `cell.isMerged` で結合判定、`cell.master` で結合元セルへの参照が可能。結合範囲の走査が容易。

4. **セルスタイルが構造化されている**: `cell.font`, `cell.border`, `cell.fill`, `cell.alignment` がそれぞれ型付きオブジェクトとして取得でき、ドメインモデルへのマッピングが直接的。

5. **イテレーション API**: `sheet.eachRow()`, `row.eachCell()`, `workbook.eachSheet()` が用意されており、全セル走査が簡潔に書ける。

### 注意点

1. **バンドルサイズ**: 約 1.5 MB（SheetJS の約 2 倍）。ただしブラウザで使う場合の話であり、パース処理を Web Worker に分離すれば初期ロードへの影響は軽減可能。

2. **Node.js 寄りの設計**: ストリーム API などは Node.js 向け。ブラウザ利用時は `workbook.xlsx.load(buffer)` を使用する。PoC ではバッファ経由で問題なく動作した。

3. **model プロパティ**: 結合情報は `sheet.model.merges` 経由での取得が必要。公開 API としての安定性はドキュメント上明示されていないが、広く利用されている。

4. **数式の結果値**: ExcelJS は数式セルを `{ formula, result }` で返す。`result` は書き出し時に設定した値がそのまま保持される。実際の Excel ファイルでは Excel が計算した結果値が格納されるため、問題ない。

## 制約 001〜004 への適合度

| 制約 | 適合度 | 詳細 |
|------|-------|------|
| 001（mm 座標系） | ◎ | 列幅（文字数）と行高（pt）を取得でき、既存の `CoordinateConverter` で mm 変換可能 |
| 002（原点 = 印刷可能領域左上） | ◎ | margins と paperSize から印刷可能領域を算出可能。既存の `Paper.calculatePrintableArea()` と連携可能 |
| 003（印刷倍率の反映） | ◎ | `pageSetup.scale` / `.fitToPage` / `.fitToWidth` / `.fitToHeight` が独立プロパティ。`ScalingConfig` への変換が直接的 |
| 004（余白のインチ保持） | ◎ | `pageSetup.margins` がインチ値そのまま。`Margins` 型への変換がノーコスト |

## 結論

ExcelJS は制約 001〜004 で必要な全情報を明快な API で提供しており、本プロジェクトの要件に適合する。ADR-002 の判断材料として、ExcelJS は有力な候補である。

SheetJS との比較が必要な場合は、同様の PoC を SheetJS で実施し、API の素直さとバンドルサイズのトレードオフを評価する。
