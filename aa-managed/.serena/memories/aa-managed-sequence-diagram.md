# AA Managed Demo - 全体シーケンス図

Web3Auth × Alchemy Account Kitを使用したAccount Abstraction（AA）デモアプリケーションの全体的なフローを示します。

## 基本構成要素

### コンポーネント
- **Frontend (Next.js)**: ユーザーインターフェース
- **Web3Auth**: ソーシャルログイン認証プロバイダー
- **Alchemy Account Kit**: Account Abstraction実装
- **Ethereum Network**: ブロックチェーンネットワーク（Sepolia テストネット）

### 主要ファイル構成
```
web/src/
├── app/page.tsx              # メインUIコンポーネント
├── lib/
│   ├── web3auth.ts          # Web3Auth サービスクラス
│   ├── aa.ts                # Account Abstraction 統合
│   └── env.ts               # 環境変数設定
└── state/useAuth.ts         # 認証状態管理（Zustand）
```

## シーケンスフロー

### 1. 初期化フェーズ

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Web3Auth
    participant AlchemyAK as Alchemy Account Kit
    participant Ethereum

    User->>Frontend: アプリケーション起動
    Frontend->>Frontend: env変数チェック (isEnvReady())
    Note over Frontend: WEB3AUTH_CLIENT_ID, ALCHEMY_RPC_URL必須
    Frontend->>Web3Auth: Web3AuthService.init()
    Web3Auth-->>Frontend: 初期化完了
    Frontend->>Frontend: ready状態をtrue
```

### 2. ログインフェーズ

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Web3Auth
    participant AuthState as useAuth Store

    User->>Frontend: "Login with Web3Auth" ボタンクリック
    Frontend->>Web3Auth: Web3AuthService.connect()
    Web3Auth->>User: ソーシャルログインモーダル表示
    User->>Web3Auth: Google/GitHub/Twitter等でログイン
    Web3Auth-->>Frontend: EOA Providerを返す
    Frontend->>Web3Auth: getAddress(), getChainId()
    Web3Auth-->>Frontend: アドレス, チェーンID
    Frontend->>AuthState: setLoggedIn(true), setAddress(), setChainId()
    AuthState-->>Frontend: 状態更新完了
```

### 3. Smart Account初期化フェーズ

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Web3Auth
    participant AlchemyAK as Alchemy Account Kit
    participant AuthState as useAuth Store

    User->>Frontend: "Initialize Smart Account" ボタンクリック
    Frontend->>Frontend: initSmartAccount()
    Frontend->>Frontend: initAA({sponsor: sponsorEnabled})
    Frontend->>Web3Auth: getProvider()
    Web3Auth-->>Frontend: EIP-1193 Provider
    Frontend->>AlchemyAK: new BrowserProvider(eip1193)
    AlchemyAK-->>Frontend: Ethers Provider
    Frontend->>AlchemyAK: getSigner()
    AlchemyAK-->>Frontend: Ethers Signer
    Frontend->>AlchemyAK: convertEthersSignerToAccountSigner()
    AlchemyAK-->>Frontend: Account Signer
    Frontend->>AlchemyAK: createLightAccount({signer, chain, transport})
    AlchemyAK-->>Frontend: Light Account
    Frontend->>AlchemyAK: createSmartAccountClient()
    AlchemyAK-->>Frontend: Smart Account Client
    Frontend->>Frontend: EthersProviderAdapter作成
    Frontend->>AuthState: setSaAddress(address)
    AuthState-->>Frontend: Smart Account準備完了
```

### 4. ETH送金フェーズ

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AlchemyAK as Alchemy Account Kit
    participant Bundler
    participant Ethereum
    participant AuthState as useAuth Store

    User->>Frontend: 送金フォーム入力（宛先、金額）
    User->>Frontend: "Send ETH (AA)" ボタンクリック
    Frontend->>Frontend: handleSend()
    alt Smart Accountが未初期化の場合
        Frontend->>Frontend: initAA() 実行
        Frontend->>AuthState: setSaAddress()
    end
    Frontend->>Frontend: sendEth(to, amount)
    Frontend->>AlchemyAK: signer.sendTransaction({to, value})
    AlchemyAK->>AlchemyAK: UserOperation構築
    AlchemyAK->>AlchemyAK: customMiddleware適用 (preVerificationGas調整)
    AlchemyAK->>Bundler: UserOperationを送信
    opt Gas Sponsorが有効の場合
        Note over AlchemyAK,Bundler: Alchemy-Gas-Manager-Policy-Id ヘッダー付き
    end
    Bundler->>Ethereum: トランザクション実行
    Ethereum-->>Bundler: トランザクションハッシュ
    Bundler-->>AlchemyAK: 実行結果
    AlchemyAK-->>Frontend: トランザクションハッシュ
    Frontend->>Frontend: setTxHash(hash)
    Frontend->>User: Etherscanリンク表示
```

### 5. ERC20送金フェーズ

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AlchemyAK as Alchemy Account Kit
    participant Ethereum

    User->>Frontend: ERC20送金フォーム入力（トークン、宛先、金額、decimals）
    User->>Frontend: "Send ERC20 (AA)" ボタンクリック
    Frontend->>Frontend: handleSendErc20()
    Frontend->>Frontend: sendErc20(token, to, amount, decimals)
    Frontend->>Frontend: Interface.encodeFunctionData("transfer", [to, amount])
    Frontend->>AlchemyAK: signer.sendTransaction({to: token, data})
    AlchemyAK->>Ethereum: UserOperation経由でERC20転送実行
    Ethereum-->>AlchemyAK: トランザクションハッシュ
    AlchemyAK-->>Frontend: 実行結果
    Frontend->>User: 結果表示
```

### 6. ログアウトフェーズ

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Web3Auth
    participant AuthState as useAuth Store

    User->>Frontend: "Logout" ボタンクリック
    Frontend->>Frontend: disconnect()
    Frontend->>Web3Auth: Web3AuthService.logout()
    Web3Auth-->>Frontend: ログアウト完了
    Frontend->>AuthState: reset()
    AuthState-->>Frontend: 全状態リセット
    Frontend->>User: ログアウト状態表示
```

## 環境変数

### 必須
- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`: Web3AuthダッシュボードからのクライアントID
- `NEXT_PUBLIC_ALCHEMY_API_KEY` or `NEXT_PUBLIC_ALCHEMY_RPC_URL`: Alchemy RPC URL
- `NEXT_PUBLIC_DEFAULT_CHAIN_ID`: チェーンID（デフォルト: 11155111 = Sepolia）

### 任意
- `NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID`: ガススポンサー用ポリシーID

## ガス管理

### Sponsorモード（ON）
- Alchemy Gas Manager Policy IDを使用してガス代をスポンサー
- HTTP ヘッダーに `Alchemy-Gas-Manager-Policy-Id` を設定
- ユーザーはガス代支払い不要

### Sponsorモード（OFF）
- 従来通りユーザーがガス代を支払い
- Smart Accountの残高から自動的にETHが消費

## エラーハンドリング

### よくあるエラー
1. **"Expected valid bigint: 0 < bigint < curve.n"**: Web3Auth設定の問題 → 修正済み
2. **"WARNING! You are on sapphire_devnet"**: 開発ネットワーク警告 → SAPPHIRE_MAINNET に変更済み
3. **hCaptcha localhost警告**: ローカル開発環境での正常な警告
4. **aria-hidden accessibility警告**: Web3Authモーダルの標準動作

### 対処法
- 各フェーズでtry-catch を実装
- エラー状態をUIで適切に表示
- ログイン状態・初期化状態の適切な管理

## 技術スタック

### Frontend
- **Next.js 15**: React フレームワーク
- **Tailwind CSS 4**: スタイリング
- **Zustand**: 状態管理
- **TypeScript**: 型安全性

### Web3
- **Web3Auth Modal SDK**: ソーシャルログイン
- **Alchemy Account Kit**: Account Abstraction
- **Ethers.js 6**: Ethereum インタラクション
- **Viem**: 低レベル Ethereum ユーティリティ

この図は現在の実装を反映し、各フェーズでの処理フローと技術要素を明確に示しています。