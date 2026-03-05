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

## 動作フロー

Excel帳票ファイルがCSS帳票テンプレートに変換されるまでの全体フローを示す。

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  .xlsx 入力   │ ──→ │  解析・変換   │ ──→ │  GUI 調整    │ ──→ │  JSON 出力   │
│  (アップロード) │     │  (自動 80%)  │     │  (手動 20%)  │     │  (インポート) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Step 1: Excel ファイルのアップロードとパース

1. ユーザーが `.xlsx` ファイルをアップロード
2. `excel/ExcelParser` がファイルをパースし、以下を抽出:
   - 印刷エリアの境界
   - セルの値・結合情報
   - 罫線・フォント・背景色などのスタイル情報
3. 出力: `RawCellData[]`（Excel ネイティブ単位）

### Step 2: 用紙サイズ判定と座標変換

1. `paper/Paper` が印刷エリアから用紙サイズを自動判定（A3〜A5、縦横）
2. `paper/CoordinateConverter` が Excel 単位を mm に変換:
   - 列幅（文字数単位）→ mm
   - 行高（ポイント単位）→ mm（`1pt = 0.3528mm`）
3. 出力: mm 単位で正規化されたセルデータ

### Step 3: ボックスモデル・線分モデルへの変換

1. 各セル/結合領域から `BoxDefinition` を生成（位置・サイズ・スタイル・変数）
2. セル罫線から `LineDefinition` を生成（始点・終点・線種・色）
3. テンプレート変数（`{{variableName}}`）をセル内容から抽出
4. 出力: `BoxDefinition[]` + `LineDefinition[]`

### Step 4: プレビュー表示とGUI調整（エディタ）

1. SVGキャンバス上にボックスと線分をプレビュー描画
2. ユーザーがGUIで微調整:
   - ボックスの移動・リサイズ・分割・追加・削除
   - 線分の追加・削除・スタイル変更
   - スナップ機能（辺・頂点吸着 + ガイドライン）
   - フォントサイズ・色・揃え・罫線の個別設定

### Step 5: 変数バインディングとエクスポート

1. テンプレート変数の型定義（string / number / date 等）
2. TypeScript interface の自動生成
3. JSON 形式で帳票テンプレートをエクスポート → システムへインポート

## 解析の解説

### Excel 単位系と変換

Excelの内部表現は印刷用途に適した物理単位ではないため、座標変換が必要になる。

| Excel の単位 | 説明 | 変換先 |
|-------------|------|--------|
| 列幅（文字数） | 標準フォントで表示できる文字数 | mm（フォントメトリクス依存） |
| 行高（ポイント） | 1pt = 1/72 インチ | mm（`1pt = 0.3528mm`） |

この変換は `paper/CoordinateConverter` が一元管理し、システム全体で **mm 絶対座標** を使用する（制約 001）。

### セル結合の解析

Excelの帳票は見た目を整えるために不規則なセル結合が多用される。パーサーは結合範囲を検出し、1つのボックスとして再構成する:

```
Excel上の結合セル:          → ボックスモデル:
┌───┬───┬───┐              ┌───────────────┐
│   結合セル   │              │  Box (x,y,w,h) │
├───┴───┴───┤              │  content: "..."│
│   通常セル   │              └───────────────┘
└───────────┘
```

### 罫線から線分への変換

セルの罫線情報（上下左右）を独立した線分（`LineDefinition`）に変換する。隣接セルの共有罫線は重複排除される:

- 同一座標・同一スタイルの罫線は1本の線分に統合
- 異なるスタイルの罫線が同一座標にある場合は、太い方または外側のセルを優先

### テンプレート変数の抽出

セル内容から `{{variableName}}` パターンを正規表現で抽出し、変数一覧を構築する。これにより、帳票テンプレートにデータを動的にバインドできる。

## 期待される出力形式

最終出力は以下の JSON 構造を持つ CSS 帳票テンプレート定義:

```json
{
  "metadata": {
    "name": "請求書テンプレート",
    "version": "1.0.0",
    "paperSize": "A4",
    "orientation": "portrait",
    "exportDate": "2026-03-05T00:00:00Z"
  },
  "boxes": [
    {
      "id": "box-001",
      "x": 10.0,
      "y": 15.5,
      "w": 50.0,
      "h": 8.0,
      "content": "{{companyName}}",
      "style": {
        "borders": {
          "bottom": { "color": "#000000", "width": 0.3, "type": "solid" }
        },
        "backgroundColor": "#FFFFFF"
      },
      "text": {
        "color": "#333333",
        "fontSize": 12,
        "fontWeight": "bold",
        "textAlign": "left"
      },
      "variables": ["companyName"]
    }
  ],
  "lines": [
    {
      "id": "line-001",
      "x1": 10.0,
      "y1": 50.0,
      "x2": 190.0,
      "y2": 50.0,
      "style": {
        "color": "#000000",
        "width": 0.5,
        "type": "solid"
      }
    }
  ],
  "variables": [
    {
      "name": "companyName",
      "type": "string",
      "defaultValue": "",
      "usedInBoxes": ["box-001"],
      "description": "会社名"
    }
  ],
  "interfaceCode": "export interface InvoiceData {\n  companyName: string;\n}"
}
```

### 座標系

- すべての座標値は **mm（ミリメートル）** 単位の絶対座標
- 原点は用紙の左上 `(0, 0)`
- CSS 出力時は `position: absolute` + mm 単位で配置

### TypeScript interface 出力例

変数定義から自動生成される型定義:

```typescript
export interface InvoiceData {
  companyName: string;
  invoiceDate: string;
  totalAmount: number;
  items: string;
}
```

## スコープ外（v1）

- Excel関数・マクロの再現
- 複数ページにまたがる帳票の自動ページ分割
- Excelファイルへの逆変換
- リアルタイム共同編集

## scaffold-templates

`scaffold-templates/` ディレクトリには DDD プロジェクトスキャフォールディング用のテンプレートが含まれる。詳細は `scaffold-templates/README.md` を参照。

## ライセンス

MIT
