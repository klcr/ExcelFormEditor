---
description: ドメイン層に新しいエンティティ（集約）を追加する (project)
---

## ガイドライン参照

作業前に必ず以下を読み込む:

- [CLAUDE.md](../../CLAUDE.md) — 設計原則・命名規約・ガードレール
- [src/domain/CLAUDE.md](../../src/domain/CLAUDE.md) — ドメイン層固有のルール
- 既存の集約（`src/domain/` 配下）を参考に構造を把握する

## 現在のドメイン構成

- 既存集約: !`ls src/domain/`

## タスク

`$ARGUMENTS` を `src/domain/` に新しい集約として追加してください。

### 作成するファイル構成

```
src/domain/{aggregate-name}/
├── {AggregateName}.ts          # エンティティ本体（PascalCase）
├── {AggregateName}.test.ts     # ユニットテスト（ガードレール③: 全ロジックをテスト）
├── {AggregateName}Types.ts     # 型定義・Value Object
├── {AggregateName}Policy.ts    # ドメインルール（ビジネスポリシー）※必要な場合
├── {AggregateName}Policy.test.ts # ポリシーのテスト ※Policyを作る場合
└── index.ts                    # 公開 API のエクスポート
```

### 実装ルール（ガードレール遵守）

1. **外部依存ゼロ**: `src/domain/` 外のパッケージを import してはいけない
2. **イミュータブル設計**: 状態変更はメソッドで新インスタンスを返す
3. **テスト必須**: 全ての public メソッドに対してテストを書く（ガードレール③）
4. **型安全**: `any` は使用禁止。Value Object は専用の型定義ファイルに定義する
5. **1ファイル500行以下**

### 完了確認

```bash
npm run type-check
npm run test
npm run lint
```
