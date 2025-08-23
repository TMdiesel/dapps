# Claude Code Instructions

このプロジェクトはWeb3/ブロックチェーンのアカウント抽象化(Account Abstraction)に関する学習プロジェクトです。

## プロジェクト概要
- Web3とブロックチェーン技術の学習
- アカウント抽象化(AA)の実装と理解
- スマートコントラクトの開発

## 開発環境
- Node.js環境
- Web3関連のライブラリ

## コーディング規約
- TypeScriptを使用
- ESLintとPrettierでコード品質を保持
- Git conventionalコミットを推奨

## よく使うコマンド
```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# テスト実行
npm test

# リント実行
npm run lint

# 型チェック
npm run typecheck

# ビルド
npm run build
```

## Claude Code 使用時の注意
- TypeScriptの型安全性を重視
- Web3関連のセキュリティベストプラクティスに従う
- ガス効率を考慮したスマートコントラクト実装
- テストファーストでの開発を推奨

## トークン節約の方法
- `mcp__serena__`ツールを積極的に活用してファイル全体を読まずに必要な部分のみ取得
- `get_symbols_overview`でファイル構造を把握してから`find_symbol`で特定のシンボルのみ読み込み
- 不要なファイル読み込みを避け、`search_for_pattern`で効率的な検索を実行
- 複数のツール呼び出しを1つのメッセージにバッチ処理
- 明確で簡潔なコマンドを使用し、冗長な出力を避ける