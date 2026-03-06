# 005-noUncheckedIndexedAccess と ExcelJS 型の不一致

## 発生日
2026-03-06

## 対象レイヤー
domain / web

## 概要
`noUncheckedIndexedAccess: true` により配列・Record のインデックスアクセスが `T | undefined` を返す。加えて ExcelJS の `Address` 型は `row`/`col` が `string` であり、ドメイン型の `number` と不一致になる。

## 背景
tsconfig.app.json で `noUncheckedIndexedAccess: true` を有効にしている。この設定により、配列 `arr[i]` のアクセスが `T` ではなく `T | undefined` を返すようになる。ループ内でインデックスが範囲内であることが保証されていても、TypeScript はそれを推論できない。

ExcelJS の `Cell` は `Address` インターフェースを継承しており、`row` と `col` が `string` 型として定義されている。しかしドメイン層の `RawCell` は `row: number`, `col: number` を期待するため、Web 層で変換が必要。

## 詳細

### パターン1: 配列のインデックスアクセス
```typescript
// NG: columnWidths[i] は number | undefined
const width = columnWidths[i] > 0 ? columnWidths[i] : DEFAULT;

// OK: nullish coalescing で安全にデフォルト値を適用
const raw = columnWidths[i] ?? DEFAULT;
const width = raw > 0 ? raw : DEFAULT;
```

### パターン2: 範囲チェック済みの配列アクセス
```typescript
// 範囲チェック後は ! で安全
if (startCol >= columnPositions.length) return null;
const x = columnPositions[startCol - 1]!; // 範囲チェック済み
```

### パターン3: 正規表現のキャプチャグループ
```typescript
const match = str.match(/^([A-Z]+)(\d+)$/);
if (!match) return null;
// match[1] は string | undefined → ! が必要
letterToColumnNumber(match[1]!);
```

### パターン4: ExcelJS Address 型の row/col
```typescript
// NG: cell.row は string（Address インターフェース由来）
row: cell.row, // Type 'string' is not assignable to type 'number'

// OK: 明示的に数値変換
row: Number(cell.row),
col: Number(cell.col),
```

### パターン5: テストでの配列アクセス
```typescript
// NG: result.boxes[0] は BoxDefinition | undefined
expect(result.boxes[0].content).toBe('テスト');

// OK: ! で非 null アサーション（テストでは undefined なら別の assert で落ちる）
expect(result.boxes[0]!.content).toBe('テスト');
```

## 影響範囲
- `src/domain/excel/ExcelParser.ts` — 配列ループ、正規表現キャプチャ、座標配列アクセス
- `src/domain/excel/ExcelParser.test.ts` — テストでの配列要素アクセス全般
- `src/web/services/parseExcelFile.ts` — ExcelJS → RawCell 変換時の型変換

## 今後の対応
- 新しいコードを書く際は `noUncheckedIndexedAccess` を前提として、配列アクセスに `!` または `??` を使用する
- ExcelJS からドメイン型への変換では、ExcelJS の型定義を事前に確認する（特に `Address` インターフェース）
- テストコードでは `result.items[0]!` パターンを標準とする

## 状態
有効
