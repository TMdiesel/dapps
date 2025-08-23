#!/bin/bash

# ローカル環境での各サービス起動スクリプト

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

# PIDファイルの場所
PID_DIR="./tmp/pids"
mkdir -p "$PID_DIR"

# サービス起動関数
start_hardhat() {
    log_info "Hardhat ローカルネットワークを起動中..."
    
    cd packages/contracts
    npm run node &
    HARDHAT_PID=$!
    echo $HARDHAT_PID > "../../$PID_DIR/hardhat.pid"
    cd ../..
    
    # ネットワーク起動を待機
    sleep 5
    
    if ps -p $HARDHAT_PID > /dev/null; then
        log_success "Hardhat ネットワーク起動完了 (PID: $HARDHAT_PID)"
        log_info "RPC エンドポイント: http://localhost:8545"
    else
        log_error "Hardhat ネットワークの起動に失敗"
        return 1
    fi
}

deploy_contracts() {
    log_info "スマートコントラクトをデプロイ中..."
    
    cd packages/contracts
    npm run deploy:local
    
    if [ $? -eq 0 ]; then
        log_success "コントラクトデプロイ完了"
        
        # デモデータのセットアップ
        log_info "デモデータをセットアップ中..."
        npm run setup-demo
        log_success "デモデータセットアップ完了"
    else
        log_error "コントラクトデプロイに失敗"
        cd ../..
        return 1
    fi
    
    cd ../..
}

start_bundler() {
    log_info "Bundler サービスを起動中..."
    
    if [ ! -d "bundler" ]; then
        log_error "Bundler ディレクトリが見つかりません"
        return 1
    fi
    
    cd bundler
    npm run bundler &
    BUNDLER_PID=$!
    echo $BUNDLER_PID > "../$PID_DIR/bundler.pid"
    cd ..
    
    # Bundler 起動を待機
    sleep 3
    
    if ps -p $BUNDLER_PID > /dev/null; then
        log_success "Bundler サービス起動完了 (PID: $BUNDLER_PID)"
        log_info "Bundler エンドポイント: http://localhost:3000"
    else
        log_error "Bundler サービスの起動に失敗"
        return 1
    fi
}

start_frontend() {
    log_info "フロントエンドを起動中..."
    
    cd packages/frontend
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "../../$PID_DIR/frontend.pid"
    cd ../..
    
    # フロントエンド起動を待機
    sleep 3
    
    if ps -p $FRONTEND_PID > /dev/null; then
        log_success "フロントエンド起動完了 (PID: $FRONTEND_PID)"
        log_info "フロントエンド: http://localhost:3000"
    else
        log_error "フロントエンドの起動に失敗"
        return 1
    fi
}

# サービス停止関数
stop_services() {
    log_info "全サービスを停止中..."
    
    # PIDファイルから各サービスを停止
    for service in hardhat bundler frontend; do
        PID_FILE="$PID_DIR/$service.pid"
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                kill $PID
                log_info "$service サービス停止 (PID: $PID)"
            fi
            rm -f "$PID_FILE"
        fi
    done
    
    # 念のため、ポートを使用しているプロセスを確認
    if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_info "ポート8545を使用中のプロセスを停止中..."
        kill $(lsof -t -i:8545) 2>/dev/null || true
    fi
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_info "ポート3000を使用中のプロセスを停止中..."
        kill $(lsof -t -i:3000) 2>/dev/null || true
    fi
    
    log_success "全サービス停止完了"
}

# メイン処理
case "$1" in
    "start")
        log_info "ローカル環境を起動します..."
        echo
        
        start_hardhat
        sleep 2
        deploy_contracts
        sleep 2
        start_bundler
        sleep 2
        start_frontend
        
        echo
        log_success "🎉 全サービスが起動しました！"
        echo
        echo "利用可能なサービス:"
        echo "- フロントエンド: http://localhost:3000"
        echo "- Hardhat RPC: http://localhost:8545"
        echo "- Bundler API: http://localhost:3000/rpc"
        echo
        echo "停止するには: ./scripts/start-local.sh stop"
        ;;
        
    "stop")
        stop_services
        ;;
        
    "restart")
        log_info "サービスを再起動します..."
        stop_services
        sleep 2
        $0 start
        ;;
        
    "status")
        log_info "サービス状態を確認中..."
        
        # 各サービスの状態確認
        for service in hardhat bundler frontend; do
            PID_FILE="$PID_DIR/$service.pid"
            if [ -f "$PID_FILE" ]; then
                PID=$(cat "$PID_FILE")
                if ps -p $PID > /dev/null 2>&1; then
                    log_success "$service: 実行中 (PID: $PID)"
                else
                    log_error "$service: 停止中"
                fi
            else
                log_error "$service: PIDファイルが見つかりません"
            fi
        done
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo
        echo "Commands:"
        echo "  start   - 全サービス起動"
        echo "  stop    - 全サービス停止"
        echo "  restart - 全サービス再起動"
        echo "  status  - サービス状態確認"
        exit 1
        ;;
esac