# Account Abstraction Demo - 環境構築ガイド

## 概要

このガイドでは、Account Abstraction (ERC-4337) デモアプリケーションの環境構築手順を説明します。

## 前提条件

- Node.js 18.0.0 以上
- npm 8.0.0 以上  
- Git

## プロジェクト構成

```
aa-demo/
├── bundler/                     # Git Submodule (eth-infinitism/bundler)
├── packages/
│   ├── contracts/               # スマートコントラクト
│   └── frontend/                # React フロントエンド
├── scripts/                     # セットアップスクリプト
├── package.json                 # ルート設定
└── SETUP.md                     # このファイル
```

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
# ルートディレクトリで実行
npm run install:all
```

### 2. 全環境の起動（推奨）

```bash
# 全サービスを並行起動
npm run start:all
```

このコマンドは以下を並行実行します：
- Hardhat ローカルネットワーク
- Bundler サービス  
- React フロントエンド

### 3. ブラウザでアクセス

- フロントエンド: http://localhost:3000
- Hardhat ネットワーク: http://localhost:8545

## 📋 詳細セットアップ手順

### Step 1: リポジトリのクローン

```bash
git clone <your-repo-url>
cd aa-demo
git submodule update --init --recursive
```

### Step 2: 依存関係のインストール

```bash
# 全パッケージの依存関係をインストール
npm install

# 各パッケージ個別のインストール
cd packages/contracts && npm install
cd ../frontend && npm install  
cd ../../bundler && npm install
```

### Step 3: コントラクトのコンパイル

```bash
# contracts パッケージでコンパイル
cd packages/contracts
npm run compile
```

### Step 4: ローカルネットワークの起動

```bash
# 新しいターミナルで実行
cd packages/contracts
npm run node
```

ローカルネットワークが http://localhost:8545 で起動します。

### Step 5: コントラクトのデプロイ

```bash
# 新しいターミナルで実行
cd packages/contracts
npm run deploy:local
```

デプロイされたコントラクトのアドレスは `packages/contracts/deployments/` に保存されます。

### Step 6: デモデータのセットアップ

```bash
# デモ用のトークン、NFT、流動性などを準備
cd packages/contracts
npm run setup-demo
```

### Step 7: Bundler サービスの起動

```bash
# 新しいターミナルで実行
cd bundler
npm run bundler
```

Bundler サービスが http://localhost:3000 で起動します。

### Step 8: フロントエンドの起動

```bash
# 新しいターミナルで実行
cd packages/frontend
npm run dev
```

フロントエンドが http://localhost:3000 で起動します。

## 🔧 個別コマンド

### コントラクト関連

```bash
# コンパイル
npm run compile:contracts

# テスト実行
npm run test:contracts

# ローカルネットワーク起動
npm run start:node

# デプロイ（ローカル）
npm run deploy:local
```

### Bundler 関連

```bash
# Bundler 起動
npm run start:bundler

# Bundler 設定確認
cd bundler && npm run config
```

### フロントエンド関連

```bash
# 開発サーバー起動
npm run dev:frontend

# ビルド
cd packages/frontend && npm run build

# 型チェック
cd packages/frontend && npm run typecheck
```

## 📁 重要なファイルとディレクトリ

### コントラクト

- `packages/contracts/contracts/demo/` - デモ用コントラクト
- `packages/contracts/contracts/paymaster/` - カスタム Paymaster
- `packages/contracts/deployments/` - デプロイ済みアドレス
- `packages/contracts/scripts/` - デプロイスクリプト

### フロントエンド

- `packages/frontend/src/components/` - UI コンポーネント
- `packages/frontend/src/hooks/` - カスタムフック
- `packages/frontend/src/services/` - ブロックチェーン統合

### Bundler

- `bundler/packages/bundler/` - メイン Bundler 実装
- `bundler/packages/validation-manager/` - 検証ロジック

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. Bundler が起動しない

```bash
# Bundler の依存関係を再インストール
cd bundler
rm -rf node_modules
npm install
```

#### 2. コントラクトデプロイが失敗する

```bash
# ローカルネットワークがリセットされた場合
cd packages/contracts
npm run node  # 新しいターミナルで
npm run deploy:local  # 再デプロイ
```

#### 3. フロントエンドでMetaMask接続エラー

- MetaMask でローカルネットワーク (http://localhost:8545) を追加
- Chain ID: 31337
- Currency Symbol: ETH

#### 4. 型エラーが発生する

```bash
# 型定義の再生成
cd packages/contracts
npm run compile

# フロントエンドの型チェック
cd packages/frontend
npm run typecheck
```

## 🔍 ログとデバッグ

### ログの場所

- Hardhat: コンソール出力
- Bundler: `bundler/logs/`
- フロントエンド: ブラウザ開発者ツール

### デバッグモード

```bash
# Bundler デバッグモード
cd bundler
DEBUG=* npm run bundler

# Hardhat 詳細ログ
cd packages/contracts
npx hardhat node --verbose
```

## 📚 関連リソース

- [Account Abstraction (ERC-4337)](https://eips.ethereum.org/EIPS/eip-4337)
- [eth-infinitism/bundler](https://github.com/eth-infinitism/bundler)
- [account-abstraction SDK](https://github.com/eth-infinitism/account-abstraction)

## 🚨 注意事項

- このデモは **教育目的** のみです
- **実際の資金を使用しないでください**
- メインネットでは使用しないでください
- セキュリティ監査を受けていません

## 📞 サポート

問題が発生した場合：

1. ログを確認
2. 全サービスの再起動
3. 依存関係の再インストール
4. GitHub Issues で報告