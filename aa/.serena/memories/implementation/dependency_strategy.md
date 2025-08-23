# Account Abstraction 依存関係戦略

## 推奨アプローチ

### 1. Account Abstraction Core (npm ライブラリ)

#### 使用ライブラリ
- `@account-abstraction/contracts` 
- `@account-abstraction/sdk`
- `@account-abstraction/utils`

#### 理由
- **標準準拠**: ERC-4337の公式実装
- **安定性**: メンテナンスされている
- **エコシステム**: 他のツールとの連携が容易
- **アップデート**: 仕様変更に自動で対応

#### 使用方法
```typescript
import { EntryPoint__factory, SimpleAccount__factory } from '@account-abstraction/contracts'
import { SimpleAccountAPI } from '@account-abstraction/sdk'
```

### 2. Bundler (Git Submodule)

#### 使用リポジトリ
- `eth-infinitism/bundler` 

#### 理由
- **公式実装**: eth-infinitismチームによる標準実装
- **学習効果**: コードを読んで理解できる
- **カスタマイズ**: 必要に応じて機能追加可能
- **最新対応**: 仕様変更にいち早く対応

#### Submodule設定
```bash
git submodule add https://github.com/eth-infinitism/bundler.git bundler
git submodule update --init --recursive
```

## 実装メリット・デメリット比較

### npmライブラリ vs 自作 (Contracts)

| 項目 | npm (@account-abstraction) | 自作実装 |
|------|---------------------------|----------|
| 開発速度 | ✅ 高速 | ❌ 低速 |
| 学習効果 | ⭕ 中程度 | ✅ 高い |
| 標準準拠 | ✅ 完全準拠 | ❌ 実装ミスリスク |
| カスタマイズ | ❌ 制限あり | ✅ 自由 |
| メンテナンス | ✅ 不要 | ❌ 必要 |

**結論**: npmライブラリを推奨

### Git Submodule vs npm vs 自作 (Bundler)

| 項目 | Git Submodule | npm bundler | 自作bundler |
|------|---------------|-------------|-------------|
| 学習効果 | ✅ コード確認可能 | ⭕ 中程度 | ✅ 最高 |
| 開発速度 | ✅ 高速 | ✅ 最高速 | ❌ 最低速 |
| カスタマイズ | ✅ 可能 | ❌ 困難 | ✅ 自由 |
| 最新対応 | ✅ 早い | ⭕ 普通 | ❌ 遅い |
| 複雑性 | ⭕ 中程度 | ✅ 低い | ❌ 高い |

**結論**: Git Submoduleが学習とのバランスで最適

## セットアップ手順

### 1. プロジェクト初期化
```bash
mkdir aa-demo
cd aa-demo
npm init -y
```

### 2. Account Abstraction依存関係追加
```bash
npm install @account-abstraction/contracts @account-abstraction/sdk @account-abstraction/utils
npm install --save-dev @account-abstraction/hardhat-plugin
```

### 3. Bundler Submodule追加
```bash
git submodule add https://github.com/eth-infinitism/bundler.git bundler
cd bundler
npm install
```

### 4. 開発環境セットアップ
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
```

## 学習上の利点

### npmライブラリ使用の利点
1. **実装に集中**: コア機能実装でなくアプリロジックに集中
2. **ベストプラクティス**: 公式実装のパターンを学習
3. **エコシステム理解**: 実際の開発フローを体験

### Submodule使用の利点
1. **内部実装理解**: bundlerの動作原理を学習
2. **デバッグ能力**: 問題発生時にコードレベルで対処
3. **拡張可能性**: 独自機能の追加方法を習得

## 注意事項

### Submodule管理
- 定期的な更新が必要: `git submodule update --remote`
- チーム開発時の同期に注意
- ビルド環境の統一が重要

### バージョン管理
- npm packageとsubmoduleのバージョン整合性
- テスト環境での動作確認必須
- 段階的アップデート推奨