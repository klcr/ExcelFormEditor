# Domain 層 — Excel Form Editor

## 役割

型定義、エンティティ、ビジネスルール、リポジトリインターフェースを管理する。
**外部ランタイム依存ゼロ**（React, Vite 等の UI 依存は禁止）。

## ディレクトリ構成

```
src/domain/
├── excel/          # Excel パース集約
│   ├── ExcelParser.ts          # パースロジック
│   ├── ExcelParser.test.ts     # テスト
│   ├── ExcelTypes.ts           # 型定義
│   └── index.ts                # 公開エクスポート
├── box/            # ボックスモデル集約
│   ├── Box.ts                  # ボックスエンティティ
│   ├── Box.test.ts
│   ├── BoxTypes.ts             # 型定義（位置・サイズ・スタイル）
│   └── index.ts
├── line/           # 線分モデル集約
│   ├── Line.ts                 # 線分エンティティ
│   ├── Line.test.ts
│   ├── LineTypes.ts            # 型定義（始点・終点・スタイル）
│   └── index.ts
├── paper/          # 用紙サイズ・座標定義
│   ├── Paper.ts                # 用紙サイズ定義・判定ロジック
│   ├── Paper.test.ts
│   ├── PaperTypes.ts           # 型定義（A3〜A5、縦横）
│   ├── CoordinateConverter.ts  # Excel単位 → mm 変換
│   └── index.ts
└── shared/         # 共有型定義
    ├── CommonTypes.ts          # 共通型（座標、サイズ等）
    └── index.ts
```

## 命名規約

- ファイル名: PascalCase（`Box.ts`, `ExcelParser.ts`）
- 型/インターフェース: PascalCase（`BoxDefinition`, `LineStyle`）
- テスト: 対象ファイルの隣に `.test.ts` 配置

## テスト原則

- **カバレッジ目標: 90% 以上**
- 全ロジックにユニットテストを書く
- モック: 原則不要（外部依存ゼロのため）
- テスト対象: エンティティのメソッド、変換ロジック、バリデーション

## 制約

- UI 層（`src/web/`）からのインポートは**絶対禁止**
- Node.js 固有 API（`fs`, `path` 等）の使用禁止（ブラウザで動作するため）
- 外部ライブラリの依存は最小限にする（Excel パースライブラリのみ許可）
- 1ファイル500行以下
