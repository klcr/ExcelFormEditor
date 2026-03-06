# 環境固有の留意事項

OS・CI 環境に起因する問題と対策を蓄積する。

## Windows

| 事象 | 対策 |
|------|------|
| 改行コード（CRLF/LF） | `.gitattributes` で `* text=auto` を設定。Biome は LF を想定 |
| パス区切り文字 | コード内では `/` を使用。`path.join()` は Node.js API のみで使用 |

## macOS

| 事象 | 対策 |
|------|------|
| （プロジェクト固有の問題が見つかり次第追記） | — |

## CI / Linux

| 事象 | 対策 |
|------|------|
| lint スコープの不一致 | CI では `npm run check-all` を使用し、ローカルと同じスコープで検証 |
| lint エラーの分割修正 | エラーの全量を先に確認し、1件ずつ修正 → push のサイクルを避ける |
| フォーマッター違反 | Biome format の違反は error 扱い |

## TypeScript strict モード

| 事象 | 対策 |
|------|------|
| `noUncheckedIndexedAccess` で配列アクセスが `T \| undefined` | ループ内の安全なアクセスは `!` を使用。不確定なアクセスは `??` でデフォルト値を適用 |
| 正規表現キャプチャグループが `string \| undefined` | null チェック後のキャプチャグループには `match[1]!` を使用 |
| テストコードの配列アクセス | `result.items[0]!.prop` パターンを標準とする |

## ExcelJS 型定義

| 事象 | 対策 |
|------|------|
| `Address.row` / `Address.col` が `string` 型 | ドメイン型への変換時に `Number(cell.row)` で明示変換する |
| `Cell` が `Address` を継承 | `cell.fullAddress.row` (number) と `cell.row` (string) を混同しない |

## Claude Code 環境

| 事象 | 対策 |
|------|------|
| lockfile 汚染 | パッケージ追加・削除時のみ lockfile を更新。不必要な変更は `git checkout` で復元 |
| OS 差異 | Claude Code は Linux 上で動作。Windows/macOS 固有のテストは手動確認 |
