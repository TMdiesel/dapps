#!/bin/bash

# Account Abstraction Demo - 自動セットアップスクリプト

set -e

echo "🚀 Account Abstraction Demo - 環境構築開始"
echo "================================================"

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ出力関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Node.js バージョンチェック
check_node_version() {
    log_info "Node.js バージョンを確認中..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js がインストールされていません"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        log_error "Node.js 18.0.0 以上が必要です（現在: v$NODE_VERSION）"
        exit 1
    fi
    
    log_success "Node.js バージョン: v$NODE_VERSION"
}

# Git submodule の初期化
init_submodules() {
    log_info "Git submodule を初期化中..."
    
    if [ -d ".git" ]; then
        git submodule update --init --recursive
        log_success "Git submodule の初期化完了"
    else
        log_warning "Git リポジトリではありません。submodule をスキップします"
    fi
}

# 依存関係のインストール
install_dependencies() {
    log_info "依存関係をインストール中..."
    
    # ルートの依存関係
    npm install
    log_success "ルート依存関係のインストール完了"
    
    # コントラクトの依存関係
    log_info "コントラクト依存関係をインストール中..."
    cd packages/contracts
    npm install
    cd ../..
    log_success "コントラクト依存関係のインストール完了"
    
    # フロントエンドの依存関係
    log_info "フロントエンド依存関係をインストール中..."
    cd packages/frontend
    npm install
    cd ../..
    log_success "フロントエンド依存関係のインストール完了"
    
    # Bundler の依存関係
    if [ -d "bundler" ]; then
        log_info "Bundler 依存関係をインストール中..."
        cd bundler
        npm install
        cd ..
        log_success "Bundler 依存関係のインストール完了"
    else
        log_warning "Bundler ディレクトリが見つかりません"
    fi
}

# コントラクトのコンパイル
compile_contracts() {
    log_info "コントラクトをコンパイル中..."
    
    cd packages/contracts
    npm run compile
    cd ../..
    
    log_success "コントラクトのコンパイル完了"
}

# 設定ファイルの作成
create_config_files() {
    log_info "設定ファイルを作成中..."
    
    # .env.local ファイルの作成
    if [ ! -f "packages/frontend/.env.local" ]; then
        cat > packages/frontend/.env.local << EOF
# ローカル開発用設定
VITE_RPC_URL=http://localhost:8545
VITE_BUNDLER_URL=http://localhost:3000
VITE_CHAIN_ID=31337
EOF
        log_success "フロントエンド設定ファイル作成完了"
    fi
    
    # Bundler 設定（必要に応じて）
    if [ -d "bundler" ] && [ ! -f "bundler/localconfig/bundler.config.json" ]; then
        mkdir -p bundler/localconfig
        cat > bundler/localconfig/bundler.config.json << EOF
{
  "network": "http://localhost:8545",
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "port": 3000,
  "auto": true
}
EOF
        log_success "Bundler 設定ファイル作成完了"
    fi
}

# サービス起動確認
check_services() {
    log_info "利用可能なポートを確認中..."
    
    # ポート8545の確認（Hardhat）
    if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "ポート8545が使用中です（Hardhat ネットワーク）"
    fi
    
    # ポート3000の確認（Bundler/Frontend）  
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "ポート3000が使用中です"
    fi
}

# 実行権限の設定
set_permissions() {
    log_info "実行権限を設定中..."
    
    chmod +x scripts/*.sh
    
    log_success "実行権限の設定完了"
}

# メイン実行
main() {
    echo
    log_info "環境構築を開始します..."
    echo
    
    check_node_version
    init_submodules
    install_dependencies
    compile_contracts
    create_config_files
    check_services
    set_permissions
    
    echo
    echo "================================================"
    log_success "🎉 環境構築が完了しました！"
    echo
    echo "次のステップ:"
    echo "1. 全サービス起動: npm run start:all"
    echo "2. ブラウザでアクセス: http://localhost:3000"
    echo
    echo "個別起動:"
    echo "- Hardhat Node: npm run start:node"
    echo "- Bundler: npm run start:bundler"  
    echo "- Frontend: npm run dev:frontend"
    echo
    echo "詳細は SETUP.md を参照してください。"
    echo "================================================"
}

# エラーハンドリング
trap 'log_error "セットアップ中にエラーが発生しました"; exit 1' ERR

# スクリプト実行
main "$@"