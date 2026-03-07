# 003-フロントエンド: 変数バインディング UI

## 状態
完了

## 担当
Claude

## 対象パッケージ
web

## 概要

ボックスにテンプレート変数を紐づけ、TypeScript 型定義を生成する UI。
Phase 3 に対応するフロントエンド実装。

## 背景

帳票テンプレートをシステムに組み込む際、各ボックスに変数（例: `{{customerName}}`）を定義する。
この変数情報から TypeScript の interface を自動生成し、型安全にテンプレートを利用できるようにする。

## 前提条件チェックリスト
- [x] 002-frontend-adjustment-editor が完了（Step A まで）
- [x] `src/domain/box/` — 変数定義・型定義ロジック

## 実装チェックリスト
- [x] PropertyPanel に変数バインディングセクションを追加
- [x] 変数名入力フィールド（`{{variableName}}` 形式）
- [x] 変数の型選択（string / number / date / boolean）
- [x] 変数一覧表示（全ボックスに定義された変数の一覧）
- [x] TypeScript interface プレビュー表示
- [x] interface コードのコピー・ダウンロード機能
- [x] 変数名の重複チェック・バリデーション
- [x] テスト作成

## 備考

- 変数のバリデーションロジックは Domain 層に配置
- UI は PropertyPanel の拡張として実装

## 関連ドキュメント
- （なし）
