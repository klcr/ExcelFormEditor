# 003-ExcelJS rowBreaks パースバグの調査と回避

## 発生日
2026-03-07

## 対象レイヤー
web（原因は外部ライブラリ ExcelJS v4.4.0）

## 概要

ExcelJS v4.4.0 の `worksheet.rowBreaks` が常に空配列を返し、Excel で設定した行改ページ（水平ページブレーク）が取得できない。ExcelJS 内部に 3 箇所のバグが存在することを特定し、JSZip による直接 XML 解析で回避した。

## 発生状況

シート内改ページによるマルチページ分割機能を実装し、ドメイン層のロジック（`PageBreakSplitter`）は全テスト通過。しかし実際の `.xlsx` ファイルをアップロードしても改ページが検出されず、全セルが 1 ページに表示される事象が発生。

## 調査経緯

### Phase 1: 症状の確認

テスト用の xlsx ファイル（10 行目に改ページを設定）を作成し動作確認。`worksheet.rowBreaks` が空配列 `[]` を返すことを確認。一方、zip 内の `xl/worksheets/sheet1.xml` を展開すると `<rowBreaks count="1"><brk id="10" .../>` が正しく記録されていることを確認。

**結論**: Excel ファイルには改ページ情報が存在するが、ExcelJS のパースで失われている。

### Phase 2: ExcelJS 内部のコードリーディング（ソース 6 ファイル以上を精読）

ExcelJS の xlsx 読み込みパイプラインを上流から追跡:

```
XLSXReader → WorksheetReader (SAX) → WorksheetXform.parseOpen/parseClose
  → RowBreaksXform (ListXform) → PageBreaksXform.parseOpen
```

各ファイルの役割と処理フローを特定:

| ファイル | 役割 |
|---------|------|
| `xlsx.js` | zip 展開、各 worksheet XML を WorksheetReader に渡す |
| `worksheet-reader.js` | SAX パーサ経由で WorksheetXform に XML イベントを流す |
| `worksheet-xform.js` | 各子要素を対応する Xform にディスパッチ |
| `row-breaks-xform.js` | `ListXform` を継承、`<rowBreaks>` の子要素を `PageBreaksXform` で処理 |
| `page-breaks-xform.js` | 個別の `<brk>` 要素をパース |

### Phase 3: バグの特定 — 3 箇所の連鎖的な不具合

**バグ 1: `PageBreaksXform.parseOpen` — 属性名の不一致**

```javascript
// ExcelJS の実装（page-breaks-xform.js）
parseOpen(node) {
  if (node.name === 'brk') {
    this.model = node.attributes.ref;  // ← ここが問題
    return true;
  }
  return false;
}
```

OOXML 仕様の `<brk>` 要素は以下の形式:

```xml
<brk id="10" max="16383" man="1"/>
```

`ref` 属性は存在せず `id` 属性にブレーク位置が格納される。結果 `this.model` は常に `undefined` → 親の `ListXform` が収集する配列は `[null, null, ...]` になる。

**バグ 2: `WorksheetXform.parseClose` — モデル未格納**

```javascript
// WorksheetXform.parseClose 内のモデル構築（414-429行目）
this.model = {
  dimensions: this.map.dimension.model,
  cols: this.map.cols.model,
  rows: this.map.sheetData.model,
  mergeCells: this.map.mergeCells.model,
  // ... 多数のプロパティ
  // rowBreaks が含まれていない ← バグ
};
```

仮にバグ 1 が修正されても、`parseClose` でモデルオブジェクトに `rowBreaks` が含まれないため、上位レイヤーに伝搬しない。

**バグ 3: `Worksheet.set model` — プロパティ未反映**

```javascript
// Worksheet クラスの model セッター
set model(value) {
  // ... 各種プロパティの設定
  // value.rowBreaks をプロパティに反映する処理がない ← バグ
}
```

3 つのバグが連鎖しており、いずれか 1 つだけ修正しても動作しない。

### Phase 4: モンキーパッチの試行と断念（5 回以上の試行）

ExcelJS の内部を実行時にパッチする方法を 5 パターン試行:

| # | 試行内容 | 結果 |
|---|---------|------|
| 1 | `PageBreaksXform.prototype.parseOpen` を差し替え（`ref` → `id`） | ❌ バグ 2, 3 が残るため伝搬しない |
| 2 | `WorksheetXform.prototype.parseClose` もパッチし `rowBreaks` をモデルに含める | ❌ `parseClose` 内の `this.map` 参照が複雑で安定しない |
| 3 | `require()` でモジュール参照を取得しパッチ | ❌ プロジェクトが ESM（`"type": "module"`）のため `require` が使えない |
| 4 | `createRequire(import.meta.url)` で CJS モジュールを取得 | ❌ Vite バンドル環境でモジュール解決が異なり、パッチ対象のインスタンスと実行時インスタンスが一致しない |
| 5 | Vite プラグインでビルド時にソースを書き換え | ❌ 過度に複雑でメンテナンス性が低い |

**断念の判断基準**: 3 箇所の連鎖バグ × ESM/CJS の壁 × Vite バンドルの内部キャッシュにより、モンキーパッチは信頼性・保守性ともに不適切と判断。

### Phase 5: JSZip による直接 XML 解析（採用）

ExcelJS が内部で使用する JSZip を利用し、xlsx ファイル（実態は zip）を直接解凍して XML を読み取る方式を採用。

```typescript
async function extractRowBreaksFromZip(
  buffer: ArrayBuffer,
): Promise<ReadonlyMap<number, readonly number[]>> {
  const zip = await JSZip.loadAsync(buffer);
  const result = new Map<number, readonly number[]>();
  const sheetPattern = /^xl\/worksheets\/sheet(\d+)\.xml$/;

  for (const [path, entry] of Object.entries(zip.files)) {
    const match = path.match(sheetPattern);
    if (!match?.[1]) continue;
    const sheetNum = Number(match[1]);
    const xml = await entry.async('string');

    // <rowBreaks> 内の <brk id="N"> を正規表現で抽出
    const rowBreaksMatch = xml.match(/<rowBreaks[^>]*>([\s\S]*?)<\/rowBreaks>/);
    if (!rowBreaksMatch?.[1]) continue;

    const brkPattern = /<brk\s+[^>]*id="(\d+)"[^>]*\/?>/g;
    const breaks: number[] = [...rowBreaksMatch[1].matchAll(brkPattern)]
      .map((m) => m[1])
      .filter((id): id is string => id !== undefined)
      .map(Number);

    if (breaks.length > 0) {
      result.set(sheetNum, breaks);
    }
  }
  return result;
}
```

**採用理由**:

1. **確実性**: OOXML の XML を直接読むため ExcelJS のバグに依存しない
2. **保守性**: ExcelJS のバージョンアップや内部構造変更の影響を受けない
3. **依存コスト**: JSZip は ExcelJS の間接依存として既に存在（ただし Vite がツリーシェイクするため明示的な import で +128KB のバンドル増加）
4. **実装の単純さ**: 正規表現ベースの XML 解析で十分（`<brk>` 要素は単純な構造）

### Phase 6: 統合と検証

`parseExcelFile()` の冒頭で `extractRowBreaksFromZip()` を呼び出し、得られた改ページ情報を `RawSheetData.rowBreaks` にマージ。ドメイン層の `splitByRowBreaks()` がこれを受けてページ分割を実行する。

テスト用 xlsx（10 行目に改ページ）で end-to-end 動作を確認。全 537 テスト通過、ビルド・lint ともにクリーン。

## 所感

### なぜ面白い事例か

1. **バグが 3 箇所に分散**: 1 箇所を直しても動かないため、全体像の把握なしには原因特定不可能
2. **入力→内部→出力の各層にバグ**: パース（入力）→ モデル構築（内部）→ プロパティ反映（出力）という異なるレイヤーに 1 つずつバグがある。どの 1 つを調べても「ここは問題ない」と誤判断しうる
3. **正攻法（モンキーパッチ）の壁**: 通常ならプロトタイプパッチで済む問題が、ESM/CJS 混在 + Vite バンドルにより不可能に
4. **回避策の逆転**: ライブラリを「修正する」のではなく「迂回する」発想の転換。ExcelJS の zip 展開機能は使わず、同じ zip を別経路で読み直すという一見冗長なアプローチが最もシンプルかつ堅牢

### 教訓

- **外部ライブラリの「動いていない機能」は複数箇所が壊れている可能性がある**: 1 つ修正して動かないからといってアプローチが間違っているとは限らない
- **迂回 > 修正**: OSS のバグ修正は upstream 貢献としては価値があるが、プロダクト開発では信頼性の高い迂回策の方が合理的な場合がある
- **zip フォーマットの透過性**: xlsx が zip であるという事実は、ライブラリのバグを迂回する強力な武器になる

## 関連ドキュメント

- `docs/constraints/006-row-page-breaks-only.md` — 行改ページのみ対応の制約記録
- `src/web/services/parseExcelFile.ts` — `extractRowBreaksFromZip()` の実装箇所
- `src/domain/excel/PageBreakSplitter.ts` — 改ページ分割ロジック

## 解決方法

JSZip で xlsx ファイルの zip を直接解凍し、`xl/worksheets/sheetN.xml` 内の `<rowBreaks>` → `<brk id="N">` を正規表現で読み取る方式で回避。ExcelJS の `worksheet.rowBreaks` は使用しない。

## 状態
解決済

## 解決日
2026-03-07
