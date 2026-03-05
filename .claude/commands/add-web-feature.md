---
description: Web UI に新しいフィーチャーを追加する (project)
---

## ガイドライン参照

作業前に必ず以下を読み込む:

- [CLAUDE.md](../../CLAUDE.md) — 設計原則・命名規約・ガードレール
- [src/web/CLAUDE.md](../../src/web/CLAUDE.md) — Web 層固有のルール
- 既存のコンポーネント（`src/web/components/`）を参考に構造を把握する

## 現在のフィーチャー構成

- 既存コンポーネント: !`ls src/web/components/`

## タスク

`$ARGUMENTS` を `src/web/` に新しいフィーチャーとして追加してください。

### 作成するファイル構成

```
src/web/components/{feature-name}/
├── {FeatureName}.tsx              # メインコンポーネント
├── {FeatureName}.test.tsx         # コンポーネントテスト
├── components/                    # フィーチャー専用サブコンポーネント
│   └── {SubComponentName}.tsx
└── hooks/                         # フィーチャー専用カスタムフック ※必要な場合
    └── use{FeatureName}.ts
```

### 実装ルール（ガードレール遵守）

**依存方向（ガードレール②）:**

- ドメイン層（`src/domain/`）への依存（型使用・ロジック呼び出し）: OK
- 共通コンポーネント（`../common/`）の使用: OK
- ドメイン層への書き込み・副作用: 禁止

**テスト原則（ガードレール③）:**

- ビジネスロジックは Domain 層に置き、UI テストは表示・インタラクションに集中
- 重いロジックのテストは Domain 層で担保する

**実装方針:**

1. ビジネスロジックを UI に書かない（ドメイン層の型・ロジックを活用）
2. グローバルに使える UI は `../common/` へ切り出す
3. 1ファイル500行以下

### 完了確認

```bash
npm run type-check
npm run test
npm run lint
```
