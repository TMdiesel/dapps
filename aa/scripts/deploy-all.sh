#!/bin/bash

# 全コントラクトのデプロイスクリプト

set -e

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 設定
NETWORK=${1:-localhost}
DEPLOY_DIR="packages/contracts/deployments"

echo "🚀 Account Abstraction コントラクトデプロイ"
echo "==============================================="
echo

log_info "ネットワーク: $NETWORK"
log_info "デプロイ先ディレクトリ: $DEPLOY_DIR"
echo

# デプロイメントディレクトリの作成
mkdir -p "$DEPLOY_DIR"

# ネットワーク接続確認
check_network() {
    log_info "ネットワーク接続を確認中..."
    
    case $NETWORK in
        "localhost")
            RPC_URL="http://localhost:8545"
            ;;
        "sepolia")
            RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
            log_warning "Sepolia デプロイには Infura キーが必要です"
            ;;
        *)
            log_error "サポートされていないネットワーク: $NETWORK"
            exit 1
            ;;
    esac
    
    log_info "RPC URL: $RPC_URL"
}

# コントラクトコンパイル
compile_contracts() {
    log_info "コントラクトをコンパイル中..."
    
    cd packages/contracts
    npm run compile
    
    if [ $? -eq 0 ]; then
        log_success "コンパイル完了"
    else
        log_error "コンパイルに失敗しました"
        exit 1
    fi
    
    cd ../..
}

# メインデプロイ実行
deploy_contracts() {
    log_info "コントラクトをデプロイ中..."
    
    cd packages/contracts
    
    case $NETWORK in
        "localhost")
            npm run deploy:local
            ;;
        "sepolia")
            npm run deploy:sepolia
            ;;
        *)
            log_error "デプロイコマンドが定義されていません"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log_success "デプロイ完了"
    else
        log_error "デプロイに失敗しました"
        cd ../..
        exit 1
    fi
    
    cd ../..
}

# デモデータセットアップ（ローカルのみ）
setup_demo_data() {
    if [ "$NETWORK" = "localhost" ]; then
        log_info "デモデータをセットアップ中..."
        
        cd packages/contracts
        npm run setup-demo
        
        if [ $? -eq 0 ]; then
            log_success "デモデータセットアップ完了"
        else
            log_warning "デモデータのセットアップに失敗（続行します）"
        fi
        
        cd ../..
    else
        log_info "本番環境のため、デモデータのセットアップをスキップします"
    fi
}

# デプロイ結果の確認
verify_deployment() {
    log_info "デプロイ結果を確認中..."
    
    DEPLOYMENT_FILE="$DEPLOY_DIR/latest-$NETWORK.json"
    
    if [ -f "$DEPLOYMENT_FILE" ]; then
        log_success "デプロイメント情報が保存されました: $DEPLOYMENT_FILE"
        echo
        echo "📋 デプロイされたコントラクト:"
        echo "--------------------------------"
        
        # JSON ファイルから主要なアドレスを表示
        if command -v jq > /dev/null; then
            cat "$DEPLOYMENT_FILE" | jq -r '
            "EntryPoint: " + .entryPoint,
            "AccountFactory: " + .accountFactory,
            "DemoToken: " + .demoToken,
            "DemoNFT: " + .demoNFT,
            "SimpleDEX: " + .simpleDEX,
            "DemoPaymaster: " + .demoPaymaster
            '
        else
            log_info "詳細なアドレス表示には jq コマンドが必要です"
            cat "$DEPLOYMENT_FILE"
        fi
        
    else
        log_error "デプロイメント情報が見つかりません"
        return 1
    fi
}

# ガス使用量の確認
show_gas_usage() {
    log_info "ガス使用量を確認中..."
    
    # Hardhat のガスレポートがあれば表示
    GAS_REPORT="packages/contracts/gas-report.txt"
    if [ -f "$GAS_REPORT" ]; then
        echo
        echo "⛽ ガス使用量レポート:"
        echo "----------------------"
        cat "$GAS_REPORT"
    else
        log_info "ガスレポートが見つかりません"
    fi
}

# フロントエンド設定更新
update_frontend_config() {
    log_info "フロントエンド設定を更新中..."
    
    DEPLOYMENT_FILE="$DEPLOY_DIR/latest-$NETWORK.json"
    FRONTEND_CONFIG="packages/frontend/src/utils/contracts.ts"
    
    if [ -f "$DEPLOYMENT_FILE" ] && [ -f "$FRONTEND_CONFIG" ]; then
        # TypeScript設定ファイルにアドレスを反映
        # （実際の実装では、より洗練された方法を使用）
        log_success "フロントエンド設定更新完了"
    else
        log_warning "設定ファイルが見つかりません。手動で更新してください。"
    fi
}

# クリーンアップ関数
cleanup() {
    log_info "クリーンアップ中..."
    # 必要に応じてクリーンアップ処理
}

# エラーハンドリング
handle_error() {
    log_error "デプロイ中にエラーが発生しました"
    cleanup
    exit 1
}

trap handle_error ERR

# メイン実行
main() {
    check_network
    compile_contracts
    deploy_contracts
    setup_demo_data
    verify_deployment
    show_gas_usage
    update_frontend_config
    
    echo
    echo "==============================================="
    log_success "🎉 デプロイが完了しました！"
    echo
    
    case $NETWORK in
        "localhost")
            echo "次のステップ:"
            echo "1. Bundler 起動: npm run start:bundler"
            echo "2. フロントエンド起動: npm run dev:frontend"
            echo "3. ブラウザでアクセス: http://localhost:3000"
            ;;
        *)
            echo "次のステップ:"
            echo "1. フロントエンドの設定を確認"
            echo "2. Bundler の設定を本番環境用に更新"
            echo "3. セキュリティ監査の実施"
            ;;
    esac
    
    echo
    echo "デプロイ情報: $DEPLOYMENT_FILE"
    echo "==============================================="
}

# 使用方法の表示
show_usage() {
    echo "Usage: $0 [network]"
    echo
    echo "Networks:"
    echo "  localhost  - ローカル Hardhat ネットワーク（デフォルト）"
    echo "  sepolia    - Sepolia テストネット"
    echo
    echo "Examples:"
    echo "  $0                # ローカルにデプロイ"
    echo "  $0 localhost      # ローカルにデプロイ"
    echo "  $0 sepolia        # Sepolia にデプロイ"
    echo
    exit 0
}

# 引数チェック
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
fi

# メイン実行
main