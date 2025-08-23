# コーディングスタイルと規約

## 言語とフレームワーク
- **主言語**: TypeScript（strict mode推奨）
- **フロントエンド**: React + TypeScript（予定）
- **スマートコントラクト**: Solidity（予定）

## コード品質ツール
- **ESLint**: JavaScriptのリント
- **Prettier**: コードフォーマット
- **TypeScript**: 型チェック

## 命名規則
- **変数・関数**: camelCase
- **クラス・型**: PascalCase
- **定数**: UPPER_SNAKE_CASE
- **ファイル名**: kebab-case または camelCase

## コードスタイル
- セミコロンあり
- シングルクオート推奨
- インデント: 2スペース

## Web3/ブロックチェーン固有の規約
- **セキュリティ重視**: セキュリティベストプラクティスに従う
- **ガス効率**: スマートコントラクトのガス効率を考慮
- **型安全性**: TypeScriptの型安全性を最大限活用

## テスト
- **テストファースト開発**: TDD推奨
- テストファイル命名: `*.test.ts` または `*.spec.ts`

## Git
- **Conventional Commits**: 
  - `feat:` 新機能
  - `fix:` バグ修正
  - `refactor:` リファクタリング
  - `test:` テスト関連
  - `docs:` ドキュメント
  - `chore:` その他

## ディレクトリ構造（予定）
```
src/
  components/     # Reactコンポーネント
  hooks/         # カスタムフック
  services/      # APIクライアント等
  types/         # 型定義
  utils/         # ユーティリティ関数
contracts/       # スマートコントラクト
tests/          # テストファイル
docs/           # ドキュメント
```

## Account Abstraction固有
- bundler, paymaster, factory の概念を理解
- eth-infinitism の規約に準拠
- ERC-4337 標準に従う