# Excel Form Editor

Excel帳票 → CSS帳票変換システム

## 概要

Excelで作成された帳票ファイルを入力とし、Webシステムで利用可能なCSS帳票テンプレートに変換するツール。変換後の帳票はボックスモデルとして再定義され、GUI上でレイアウト調整・変数定義を行ったうえでシステムにインポートして運用する。

**方針: 「80%自動・20%手動調整」**

Excelの帳票は見た目合わせのために不規則な結合や装飾が多く、完全自動変換は目指さない。自動変換で大枠を作り、エディタで仕上げる前提とする。

## 機能概要

### Phase 1: Excel パーサー + プレビュー
- .xlsx ファイルのアップロード・パース
- 印刷エリアの取得、行高・列幅の mm 変換
- 用紙サイズの自動判定（A3〜A5、縦横）
- セル情報（結合、罫線、フォント、背景色）の抽出
- ボックスモデルへの変換・プレビュー表示

### Phase 2: 調整エディタ
- ボックスの移動・リサイズ・分割・追加・削除
- 線分の追加・削除（線種・太さ・色設定）
- スナップ機能（辺・頂点吸着 + ガイドライン表示）
- 座標・サイズの数値直接入力

### Phase 3: 変数バインディングと型定義
- テンプレート記法（`{{variableName}}`）の抽出・編集
- TypeScript interface の自動生成

### Phase 4: レイアウト微調整 UI
- フォントサイズ・文字色・背景色・テキスト揃え・インデント調整
- 罫線の個別設定（上下左右）
- JSON 出力 → システムへインポート

## 技術スタック

| カテゴリ | 選定 |
|---------|------|
| 言語 | TypeScript |
| フロントエンド | React + Vite |
| リンター/フォーマッター | Biome |
| テスト | Vitest |
| Git フック | husky + lint-staged |

## セットアップ

```bash
npm install
```

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run test         # テスト実行
npm run lint         # Biome lint
npm run lint:fix     # Biome lint + 自動修正
npm run format       # Biome フォーマット
npm run type-check   # TypeScript 型チェック
npm run check-all    # lint + 型チェック + テスト（CI 相当）
```

## アーキテクチャ

DDD（ドメイン駆動設計）+ レイヤードアーキテクチャ

```
src/
├── domain/           # ドメイン層（外部依存ゼロ）
│   ├── excel/        # Excel パース集約
│   ├── box/          # ボックスモデル集約
│   ├── line/         # 線分モデル集約
│   ├── paper/        # 用紙サイズ・座標定義
│   └── shared/       # 共有型定義
└── web/              # Web UI 層
    ├── components/   # React コンポーネント
    ├── hooks/        # カスタムフック
    └── utils/        # UI ユーティリティ
```

**依存方向:** `web/` → `domain/`（型のみ）。`domain/` は外部依存ゼロ。

## スコープ外（v1）

- Excel関数・マクロの再現
- 複数ページにまたがる帳票の自動ページ分割
- Excelファイルへの逆変換
- リアルタイム共同編集

## scaffold-templates

`scaffold-templates/` ディレクトリには DDD プロジェクトスキャフォールディング用のテンプレートが含まれる。詳細は `scaffold-templates/README.md` を参照。

## ライセンス

MIT
