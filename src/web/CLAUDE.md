# Web UI 層 — Excel Form Editor

## 役割

React コンポーネント、カスタムフック、UI ユーティリティを管理する。
ビジネスロジックは Domain 層に委譲し、UI テストを軽量に保つ。

## ディレクトリ構成

```
src/web/
├── components/     # React コンポーネント
│   ├── upload/     # ファイルアップロード関連
│   ├── preview/    # 帳票プレビュー関連
│   ├── editor/     # 調整エディタ関連
│   │   ├── BoxEditor/     # ボックス操作
│   │   ├── LineEditor/    # 線分操作
│   │   ├── SnapGuide/     # スナップ機能
│   │   └── PropertyPanel/ # プロパティ編集パネル
│   └── common/     # 共通 UI コンポーネント
├── hooks/          # カスタムフック
│   ├── useBoxEditor.ts
│   ├── useSnap.ts
│   └── useExcelUpload.ts
└── utils/          # UI ユーティリティ
    ├── svgHelpers.ts
    └── printStyles.ts
```

## 命名規約

- React コンポーネント: PascalCase（`DetailView.tsx`, `BoxEditor.tsx`）
- フック: camelCase + `use` プレフィックス（`useBoxEditor.ts`）
- ユーティリティ: camelCase（`svgHelpers.ts`）
- テスト: 対象ファイルの隣に `.test.tsx` 配置

## 依存ルール

- `src/domain/` からの型インポート: **許可**（型のみ）
- `src/domain/` のロジック呼び出し: **許可**
- Domain 層への書き込み・副作用: **禁止**（Domain 層は純粋関数のみ）

## テスト原則

- コンポーネント単体テスト
- ビジネスロジックは Domain 層に置き、UI テストを軽量に保つ
- 操作の統合テスト（ドラッグ、スナップ等）は必要に応じて

## 制約

- 1ファイル500行以下
- ビジネスロジックを直接書かない（Domain 層に委譲）
