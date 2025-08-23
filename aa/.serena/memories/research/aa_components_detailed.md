# Account Abstraction コンポーネント詳細解説（改良版）

## AA全体のアーキテクチャ（Entity=ノード、Action=エッジ）

```mermaid
graph TB
    subgraph "Frontend Layer"
        USER[User]
        FRONTEND[React Frontend]
        WEB3[Web3 Library]
    end
    
    subgraph "Off-chain Infrastructure"
        BUNDLER[Bundler Service]
        MEMPOOL[UserOp Mempool]
        SIM_ENGINE[Simulation Engine]
        MEV_OPT[MEV Optimizer]
    end
    
    subgraph "On-chain Core"
        ENTRY_POINT[Entry Point Contract]
    end
    
    subgraph "Smart Contracts"
        SMART_WALLET[Smart Contract Wallet]
        PAYMASTER[Paymaster Contract]
        FACTORY[Factory Contract]
        TARGET[Target Contracts]
    end
    
    subgraph "Blockchain Network"
        ETHEREUM[Ethereum/L2 Network]
    end
    
    USER -->|操作要求| FRONTEND
    FRONTEND -->|UserOp構築| WEB3
    WEB3 -->|UserOp送信| BUNDLER
    BUNDLER -->|検証・バンドリング| ENTRY_POINT
    ENTRY_POINT -->|検証依頼| SMART_WALLET
    ENTRY_POINT -->|ガス代確認| PAYMASTER
    ENTRY_POINT -->|ウォレット作成| FACTORY
    SMART_WALLET -->|実行| TARGET
    
    BUNDLER -->|UserOp保存| MEMPOOL
    BUNDLER -->|シミュレーション| SIM_ENGINE
    BUNDLER -->|最適化| MEV_OPT
    
    ENTRY_POINT -->|トランザクション実行| ETHEREUM
    SMART_WALLET -->|状態変更| ETHEREUM
    PAYMASTER -->|ガス代支払い| ETHEREUM
    FACTORY -->|コントラクトデプロイ| ETHEREUM
    
    style USER fill:#e3f2fd
    style BUNDLER fill:#f3e5f5
    style ENTRY_POINT fill:#e8f5e8
    style SMART_WALLET fill:#fff3e0
    style PAYMASTER fill:#fce4ec
    style FACTORY fill:#e1f5fe
```

## 1. Bundler（バンドラー）詳細アーキテクチャ（改良版）

### 役割
- **UserOperationの収集**: 複数ユーザーからのUserOpを集める
- **事前検証**: オフチェーンでUserOpの妥当性をチェック
- **バンドリング**: 複数のUserOpを1つのトランザクションにまとめる
- **オンチェーン送信**: Entry Pointに送信して実行

```mermaid
graph TD
    subgraph "Bundler Components"
        API_SERVER[JSON-RPC API Server]
        VALIDATOR[Request Validator]
        SIM_ENGINE[Simulation Engine]
        GAS_CALC[Gas Calculator]
        MEMPOOL_MGR[Mempool Manager]
        PRIORITY_Q[Priority Queue]
        DEDUP_ENGINE[Deduplication Engine]
        USER_SELECTOR[UserOp Selector]
        MEV_OPT[MEV Optimizer]
        TX_BUILDER[Transaction Builder]
        CHAIN_SENDER[Chain Sender]
        MONITOR[Status Monitor]
    end
    
    API_SERVER -->|UserOp受信| VALIDATOR
    VALIDATOR -->|事前検証| SIM_ENGINE
    SIM_ENGINE -->|シミュレーション実行| GAS_CALC
    GAS_CALC -->|ガス見積もり| MEMPOOL_MGR
    MEMPOOL_MGR -->|UserOp格納| PRIORITY_Q
    PRIORITY_Q -->|優先度付け| DEDUP_ENGINE
    DEDUP_ENGINE -->|重複除去| USER_SELECTOR
    USER_SELECTOR -->|UserOp選択| MEV_OPT
    MEV_OPT -->|MEV最適化| TX_BUILDER
    TX_BUILDER -->|バンドル構築| CHAIN_SENDER
    CHAIN_SENDER -->|オンチェーン送信| MONITOR
    
    style API_SERVER fill:#e3f2fd
    style SIM_ENGINE fill:#e8f5e8
    style MEMPOOL_MGR fill:#e8f5e8
    style MEV_OPT fill:#fff3e0
    style CHAIN_SENDER fill:#fce4ec
```

## 2. Paymaster パターン詳細（改良版）

```mermaid
graph TD
    subgraph "Paymaster Implementations"
        subgraph "Verifying Type"
            VERIFY_PM[Verifying Paymaster]
            SIG_VERIFIER[Signature Verifier]
            WHITELIST_MGR[Whitelist Manager]
            VOUCHER_VAL[Voucher Validator]
        end
        
        subgraph "Token Type"  
            TOKEN_PM[Token Paymaster]
            ERC20_HANDLER[ERC20 Handler]
            SWAP_ENGINE[Swap Engine]
            PRICE_ORACLE[Price Oracle]
        end
        
        subgraph "Deposit Type"
            DEPOSIT_PM[Deposit Paymaster]
            BALANCE_MGR[Balance Manager]
            ACCOUNT_MGR[Account Manager]
            RATE_LIMITER[Rate Limiter]
        end
    end
    
    subgraph "Core Components"
        ENTRY_POINT_REF[Entry Point Contract]
        GAS_RESERVE[Gas Reserve Pool]
        CONTEXT_GEN[Context Generator]
    end
    
    VERIFY_PM -->|署名確認| SIG_VERIFIER
    VERIFY_PM -->|ホワイトリスト確認| WHITELIST_MGR
    VERIFY_PM -->|バウチャー検証| VOUCHER_VAL
    
    TOKEN_PM -->|トークン処理| ERC20_HANDLER
    TOKEN_PM -->|価格変換| SWAP_ENGINE
    TOKEN_PM -->|レート取得| PRICE_ORACLE
    
    DEPOSIT_PM -->|残高管理| BALANCE_MGR
    DEPOSIT_PM -->|アカウント管理| ACCOUNT_MGR
    DEPOSIT_PM -->|制限確認| RATE_LIMITER
    
    ENTRY_POINT_REF -->|検証依頼| VERIFY_PM
    ENTRY_POINT_REF -->|検証依頼| TOKEN_PM
    ENTRY_POINT_REF -->|検証依頼| DEPOSIT_PM
    
    CONTEXT_GEN -->|コンテキスト生成| ENTRY_POINT_REF
    GAS_RESERVE -->|ガス代預託| ENTRY_POINT_REF
    
    style VERIFY_PM fill:#e8f5e8
    style TOKEN_PM fill:#fff3e0
    style DEPOSIT_PM fill:#fce4ec
    style ENTRY_POINT_REF fill:#f3e5f5
```

## 3. 完全なUserOperation データフロー（Paymaster、Factory含む）

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend
    participant Bundler as Bundler Service
    participant EntryPoint as Entry Point Contract
    participant Wallet as Smart Wallet
    participant Paymaster as Paymaster Contract
    participant Factory as Factory Contract
    participant Target as Target Contract
    participant Mempool as Mempool Storage
    participant SimEngine as Simulation Engine
    
    Note over User,Target: Phase 1: UserOperation 作成・送信
    User->>Frontend: 操作要求 (送金、スワップ等)
    Frontend->>Frontend: UserOperation構築
    Frontend->>User: 署名要求 (MetaMask等)
    User->>Frontend: 秘密鍵で署名
    Frontend->>Bundler: eth_sendUserOperation
    
    Note over Bundler,SimEngine: Phase 2: Bundler検証・シミュレーション
    Bundler->>Bundler: 基本フォーマット検証
    Bundler->>SimEngine: シミュレーション依頼
    SimEngine->>EntryPoint: validateUserOp() (dry run)
    
    alt 新規ウォレット作成が必要
        EntryPoint->>Factory: createAccount()シミュレーション
        Factory-->>EntryPoint: 作成可能性確認
    end
    
    EntryPoint->>Wallet: validateUserOp()シミュレーション
    Wallet-->>EntryPoint: 検証結果返却
    
    alt Paymaster使用の場合
        EntryPoint->>Paymaster: validatePaymasterUserOp()
        Paymaster->>Paymaster: 資格・残高確認
        Paymaster-->>EntryPoint: context + validation結果
    end
    
    EntryPoint-->>SimEngine: 総合シミュレーション結果
    SimEngine-->>Bundler: ガス見積もり含む検証結果
    
    alt 検証成功
        Bundler->>Mempool: UserOp格納
        Bundler-->>Frontend: UserOpHash返却
    else 検証失敗
        Bundler-->>Frontend: エラー詳細返却
    end
    
    Note over Bundler,Target: Phase 3: バンドリング・実行
    Bundler->>Mempool: 実行対象UserOp選択
    Bundler->>Bundler: MEV最適化・バンドル作成
    Bundler->>EntryPoint: handleOps(UserOp[])実行
    
    loop 各UserOpに対して実際の処理
        Note over EntryPoint,Target: Individual UserOp Processing
        
        alt 新規ウォレット作成
            EntryPoint->>Factory: createAccount()実行
            Factory->>Wallet: ウォレットデプロイ・初期化
            Factory-->>EntryPoint: ウォレット作成完了
        end
        
        EntryPoint->>Wallet: validateUserOp()実際の検証
        Wallet->>Wallet: 署名検証・nonce確認
        Wallet-->>EntryPoint: 検証結果
        
        alt Paymaster使用
            EntryPoint->>Paymaster: validatePaymasterUserOp()実行
            Paymaster->>Paymaster: 事前ガス代徴収
            Paymaster-->>EntryPoint: コンテキスト確定
        end
        
        alt 検証成功時のみ実行
            EntryPoint->>Wallet: execute()実行
            Wallet->>Target: 実際のビジネスロジック実行
            Target->>Target: 状態変更・処理実行
            Target-->>Wallet: 実行結果
            Wallet-->>EntryPoint: 実行完了通知
        end
        
        alt Paymaster後処理
            EntryPoint->>Paymaster: postOp(実際のガス消費量)
            Paymaster->>Paymaster: 最終決済処理
            Paymaster->>Paymaster: 差額返金/追加徴収
        end
    end
    
    EntryPoint-->>Bundler: 全UserOp実行完了
    Bundler-->>Frontend: UserOp receipt通知
    Frontend-->>User: 処理完了・結果表示
```

## 4. ガス計算とコストモデル（改良版）

```mermaid
graph TD
    subgraph "Gas Cost Breakdown"
        TOTAL_GAS[Total Gas Cost]
        
        subgraph "Pre-verification Components"
            PRE_GAS[preVerificationGas]
            BUNDLER_OVERHEAD[Bundler Overhead Calculator]
            CALLDATA_COST[Calldata Cost Calculator]
        end
        
        subgraph "Verification Components"
            VER_GAS[verificationGasLimit]
            SIG_VERIFIER_GAS[Signature Verifier]
            PAYMASTER_VERIFIER[Paymaster Verifier]
            NONCE_CHECKER[Nonce Checker]
        end
        
        subgraph "Execution Components"
            CALL_GAS[callGasLimit]
            CONTRACT_CALLER[Contract Caller]
            STATE_UPDATER[State Updater]
        end
        
        subgraph "Post-processing Components"
            POST_GAS[postOpGas]
            PAYMASTER_SETTLER[Paymaster Settler]
            EVENT_EMITTER[Event Emitter]
        end
    end
    
    TOTAL_GAS -->|構成要素| PRE_GAS
    TOTAL_GAS -->|構成要素| VER_GAS
    TOTAL_GAS -->|構成要素| CALL_GAS
    TOTAL_GAS -->|構成要素| POST_GAS
    
    PRE_GAS -->|計算| BUNDLER_OVERHEAD
    PRE_GAS -->|計算| CALLDATA_COST
    
    VER_GAS -->|消費| SIG_VERIFIER_GAS
    VER_GAS -->|消費| PAYMASTER_VERIFIER
    VER_GAS -->|消費| NONCE_CHECKER
    
    CALL_GAS -->|実行| CONTRACT_CALLER
    CALL_GAS -->|更新| STATE_UPDATER
    
    POST_GAS -->|決済| PAYMASTER_SETTLER
    POST_GAS -->|記録| EVENT_EMITTER
    
    style TOTAL_GAS fill:#e1f5fe
    style PRE_GAS fill:#f3e5f5
    style VER_GAS fill:#e8f5e8
    style CALL_GAS fill:#fff3e0
    style POST_GAS fill:#fce4ec
```

## 5. エラーハンドリングと復旧フロー（改良版）

```mermaid
graph TD
    subgraph "Error Sources"
        USER_ERROR[User Input Error]
        VALIDATION_ERROR[Validation Error]
        EXECUTION_ERROR[Execution Error]
        GAS_ERROR[Gas Estimation Error]
        PAYMASTER_ERROR[Paymaster Error]
    end
    
    subgraph "Error Handlers"
        ERROR_DETECTOR[Error Detector]
        ERROR_CLASSIFIER[Error Classifier]
        RETRY_MANAGER[Retry Manager]
        FALLBACK_HANDLER[Fallback Handler]
    end
    
    subgraph "Recovery Actions"
        REESTIMATE_GAS[Gas Re-estimation]
        FALLBACK_PAYMASTER[Fallback to User Payment]
        PARTIAL_EXECUTION[Partial Execution]
        FULL_ROLLBACK[Full Rollback]
    end
    
    USER_ERROR -->|検出| ERROR_DETECTOR
    VALIDATION_ERROR -->|検出| ERROR_DETECTOR
    EXECUTION_ERROR -->|検出| ERROR_DETECTOR
    GAS_ERROR -->|検出| ERROR_DETECTOR
    PAYMASTER_ERROR -->|検出| ERROR_DETECTOR
    
    ERROR_DETECTOR -->|分類| ERROR_CLASSIFIER
    ERROR_CLASSIFIER -->|リトライ判定| RETRY_MANAGER
    ERROR_CLASSIFIER -->|フォールバック実行| FALLBACK_HANDLER
    
    RETRY_MANAGER -->|ガス再見積もり| REESTIMATE_GAS
    FALLBACK_HANDLER -->|支払い方法変更| FALLBACK_PAYMASTER
    FALLBACK_HANDLER -->|部分実行| PARTIAL_EXECUTION
    FALLBACK_HANDLER -->|完全ロールバック| FULL_ROLLBACK
    
    style ERROR_DETECTOR fill:#ffebee
    style RETRY_MANAGER fill:#fff0e1
    style FALLBACK_HANDLER fill:#f3e5f5
```

## 6. UserOperation構造とコンポーネント関係

### UserOperation構造
```typescript
interface UserOperation {
  sender: string;          // ウォレットアドレス
  nonce: BigNumber;       // リプレイ攻撃防止
  initCode: string;       // ウォレット初期化コード
  callData: string;       // 実際の実行データ
  callGasLimit: BigNumber;
  verificationGasLimit: BigNumber;
  preVerificationGas: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
  paymasterAndData: string; // Paymaster情報
  signature: string;       // 署名
}
```

### Smart Wallet内部構造
```mermaid
classDiagram
    class BaseAccount {
        <<abstract>>
        +validateUserOp()
        +entryPoint() IEntryPoint
        +getNonce() uint256
    }
    
    class SimpleAccount {
        +address owner
        +validateUserOp()
        +execute()
        +executeBatch()
        +initialize()
    }
    
    class MultiSigAccount {
        +mapping(address=>bool) owners
        +uint256 required
        +validateUserOp()
        +addOwner()
        +removeOwner()
    }
    
    class RecoveryAccount {
        +mapping(address=>bool) guardians
        +uint256 recoveryThreshold
        +validateUserOp()
        +initiateRecovery()
        +executeRecovery()
    }
    
    BaseAccount <|-- SimpleAccount
    BaseAccount <|-- MultiSigAccount
    BaseAccount <|-- RecoveryAccount
```

## 学習での実装優先順位

1. **Simple Account Wallet**: 基本的な署名検証のみ
2. **Factory**: CREATE2でのウォレット展開
3. **Basic Bundler**: 単一UserOpの処理
4. **Simple Paymaster**: デポジット型の代理支払い
5. **Frontend Integration**: React UIでの操作
6. **Advanced Features**: マルチシグ、バッチ処理等