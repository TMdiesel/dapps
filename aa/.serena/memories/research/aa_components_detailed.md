# Account Abstraction コンポーネント詳細解説

## AA全体のアーキテクチャ

```mermaid
graph TB
    subgraph "Frontend Layer"
        U[User] --> UI[React Frontend]
        UI --> WEB3[Web3 Library]
    end
    
    subgraph "Off-chain Infrastructure"
        WEB3 --> B[Bundler]
        B --> MEMPOOL[UserOp Mempool]
        B --> SIM[Simulation Engine]
        B --> MEV[MEV Optimizer]
    end
    
    subgraph "On-chain Core"
        EP[Entry Point Contract]
    end
    
    subgraph "Smart Contracts"
        SW[Smart Contract Wallet]
        PM[Paymaster Contract]
        FC[Factory Contract]
        TC[Target Contracts]
    end
    
    subgraph "Blockchain Network"
        CHAIN[Ethereum/L2]
    end
    
    B --> EP
    EP --> SW
    EP --> PM
    EP --> FC
    SW --> TC
    
    EP --> CHAIN
    SW --> CHAIN
    PM --> CHAIN
    FC --> CHAIN
    
    style U fill:#e3f2fd
    style B fill:#f3e5f5
    style EP fill:#e8f5e8
    style SW fill:#fff3e0
    style PM fill:#fce4ec
    style FC fill:#e1f5fe
```

## 1. Bundler（バンドラー）

### 役割
- **UserOperationの収集**: 複数ユーザーからのUserOpを集める
- **事前検証**: オフチェーンでUserOpの妥当性をチェック
- **バンドリング**: 複数のUserOpを1つのトランザクションにまとめる
- **オンチェーン送信**: Entry Pointに送信して実行

### 詳細アーキテクチャ

```mermaid
flowchart TD
    subgraph "Bundler Internal Architecture"
        API[JSON-RPC API Server]
        
        subgraph "Validation Layer"
            PRE[Pre-validation]
            SIM[Simulation Engine]
            GAS[Gas Estimation]
        end
        
        subgraph "Mempool Management"
            MP[Mempool Storage]
            PRIO[Priority Queue]
            DEDUP[Deduplication]
        end
        
        subgraph "Bundle Creation"
            SEL[UserOp Selection]
            OPT[MEV Optimization]
            BATCH[Bundle Creation]
        end
        
        subgraph "Execution"
            TX[Transaction Builder]
            SEND[Chain Sender]
            MON[Monitoring]
        end
    end
    
    API --> PRE
    PRE --> SIM
    SIM --> GAS
    GAS --> MP
    MP --> PRIO
    PRIO --> DEDUP
    DEDUP --> SEL
    SEL --> OPT
    OPT --> BATCH
    BATCH --> TX
    TX --> SEND
    SEND --> MON
    
    style API fill:#e3f2fd
    style SIM fill:#f3e5f5
    style MP fill:#e8f5e8
    style OPT fill:#fff3e0
    style SEND fill:#fce4ec
```

### 動作フロー
1. **UserOp受信**: JSON-RPC経由でUserOperationを受信
2. **シミュレーション**: ガス計算と実行可能性を確認
3. **メンプール管理**: 有効なUserOpをメンプールに保存
4. **バンドル作成**: 利益最大化のためUserOpを選択・組み合わせ
5. **オンチェーン実行**: handleOps()をEntry Pointで呼び出し

### 経済モデル
- **MEV機会**: ガス差額やPaymaster報酬で利益を得る
- **競争環境**: 複数のBundlerが競合
- **リスク**: 失敗したUserOpのガス代負担

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

## 2. Paymaster（ペイマスター）

### 役割
- **ガス代代理支払い**: ユーザーの代わりにガス代を支払う
- **柔軟な料金モデル**: ETH以外のトークンでの支払い受付
- **スポンサーシップ**: 企業がユーザーのガス代を負担

### Paymasterパターン詳細

```mermaid
graph TD
    subgraph "Paymaster Types"
        subgraph "Verifying Paymaster"
            VP[Verifying Paymaster]
            VP --> VPS[署名検証ロジック]
            VP --> VPW[ホワイトリスト管理]
            VP --> VPV[バウチャー検証]
        end
        
        subgraph "Token Paymaster"  
            TP[Token Paymaster]
            TP --> TPE[ERC20 Exchange]
            TP --> TPS[Swap Logic]
            TP --> TPO[Oracle Price Feed]
        end
        
        subgraph "Deposit Paymaster"
            DP[Deposit Paymaster]
            DP --> DPB[Deposit Balance]
            DP --> DPA[Account Management]
            DP --> DPR[Rate Limiting]
        end
    end
    
    subgraph "Paymaster Flow"
        VALIDATE[validatePaymasterUserOp]
        CONTEXT[Context Generation]
        PREPAY[Pre-payment]
        EXECUTE[UserOp Execution]
        POSTOP[postOp Settlement]
    end
    
    VP --> VALIDATE
    TP --> VALIDATE
    DP --> VALIDATE
    VALIDATE --> CONTEXT
    CONTEXT --> PREPAY
    PREPAY --> EXECUTE
    EXECUTE --> POSTOP
    
    style VP fill:#e8f5e8
    style TP fill:#fff3e0
    style DP fill:#fce4ec
    style VALIDATE fill:#f3e5f5
```

### Paymasterの種類

#### A. Verifying Paymaster
- **署名検証型**: 事前に署名されたバウチャーを検証
- **使用例**: プリペイド型、ホワイトリスト型

#### B. Token Paymaster  
- **トークン交換型**: ERC-20トークンでガス代を受け取る
- **使用例**: USDCでガス代支払い

#### C. Deposit Paymaster
- **デポジット型**: 事前にデポジットされた資金を使用
- **使用例**: サブスクリプション型アプリ

### 実装例（概念）
```solidity
contract SimplePaymaster is BasePaymaster {
    mapping(address => uint256) public deposits;
    
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external view override returns (bytes memory context) {
        // 1. ユーザーの資格確認
        // 2. ガス代の事前計算
        // 3. 支払い能力の確認
    }
    
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external override {
        // 実際のガス代の決済処理
    }
}
```

## 3. Factory Contract（ファクトリー）

### 役割
- **ウォレット展開**: 新しいスマートコントラクトウォレットの作成
- **決定論的アドレス**: CREATE2による予測可能なアドレス生成
- **初期化**: ウォレットの初期設定

### Factory詳細フロー

```mermaid
sequenceDiagram
    participant F as Frontend
    participant FC as Factory Contract
    participant W as Wallet Implementation
    participant SW as Smart Wallet Instance
    
    Note over F,SW: カウンターファクチュアル フェーズ
    F->>FC: getAddress(owner, salt)
    FC->>FC: CREATE2 アドレス計算
    FC-->>F: 予測アドレス
    F->>F: 予測アドレスに資金送金
    
    Note over F,SW: ウォレット作成フェーズ
    F->>FC: createAccount(owner, salt) via UserOp
    FC->>FC: アドレス存在確認
    
    alt ウォレット未作成
        FC->>W: cloneDeterministic()
        W->>SW: プロキシ作成
        FC->>SW: initialize(owner)
        SW->>SW: 初期化処理
        SW-->>FC: 作成完了
    else 既に存在
        FC->>SW: 既存インスタンス返却
    end
    
    FC-->>F: ウォレットアドレス
```

### CREATE2の利点
- **アドレス事前計算**: デプロイ前にアドレスが分かる
- **カウンターファクチュアル**: 実際にデプロイする前に送金可能
- **セキュリティ**: saltによる一意性保証

### 実装例
```solidity
contract SimpleAccountFactory {
    IEntryPoint public immutable entryPoint;
    
    function createAccount(
        address owner,
        uint256 salt
    ) public returns (SimpleAccount ret) {
        address addr = getAddress(owner, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return SimpleAccount(payable(addr));
        }
        
        ret = SimpleAccount(payable(Clones.cloneDeterministic(
            accountImplementation, 
            _salt
        )));
        ret.initialize(owner);
    }
    
    function getAddress(address owner, uint256 salt)
        public view returns (address) {
        return Clones.predictDeterministicAddress(
            accountImplementation,
            _salt
        );
    }
}
```

## 4. Smart Contract Wallet

### 基本機能
- **署名検証**: カスタム署名方式の実装
- **実行ロジック**: トランザクションの実行
- **アップグレード**: プロキシパターンでの機能拡張

### Wallet内部構造

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
    
    class TimelockAccount {
        +mapping(bytes32=>Timelock) timelocks
        +uint256 delay
        +validateUserOp()
        +scheduleOperation()
        +executeOperation()
    }
    
    BaseAccount <|-- SimpleAccount
    BaseAccount <|-- MultiSigAccount
    BaseAccount <|-- RecoveryAccount
    BaseAccount <|-- TimelockAccount
```

### セキュリティ機能
- **マルチシグ**: 複数署名による承認
- **時間ロック**: 重要な操作の遅延実行
- **支出制限**: 1日あたりの支出上限
- **ホワイトリスト**: 許可されたアドレスのみとの取引

### 実装例（シンプル版）
```solidity
contract SimpleAccount is BaseAccount {
    address public owner;
    IEntryPoint private immutable _entryPoint;
    
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        // 1. 署名の検証
        // 2. nonce の確認
        // 3. ガス代の事前支払い
    }
    
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        _requireFromEntryPoint();
        _call(dest, value, func);
    }
}
```

## 5. UserOperation データフロー

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Bundler
    participant E as EntryPoint
    participant W as Smart Wallet
    participant P as Paymaster
    participant T as Target Contract
    
    Note over U,T: UserOperation 作成・送信フェーズ
    U->>F: 操作要求 (送金、スワップ等)
    F->>F: UserOperation 構築
    F->>U: 署名要求 (MetaMask等)
    U->>F: 署名完了
    F->>B: eth_sendUserOperation
    
    Note over B: Bundler 検証フェーズ
    B->>B: 基本検証 (ガス、フォーマット)
    B->>E: シミュレーション実行
    E->>W: validateUserOp() (dry run)
    alt Paymaster使用
        E->>P: validatePaymasterUserOp()
        P-->>E: context + validation
    end
    W-->>E: validation結果
    E-->>B: シミュレーション結果
    B->>B: メンプール追加
    
    Note over B: バンドリング・実行フェーズ  
    B->>B: MEV最適化でUserOp選択
    B->>E: handleOps(UserOp[])
    
    loop 各UserOpに対して
        E->>W: validateUserOp() (実際)
        alt Paymaster使用
            E->>P: validatePaymasterUserOp()
            P->>P: ガス代事前徴収
        end
        E->>W: execute()
        W->>T: 実際の処理実行
        T-->>W: 実行結果
        alt Paymaster使用
            E->>P: postOp() (実際のガス代決済)
        end
    end
    
    E-->>B: 実行完了
    B-->>F: UserOp receipt
    F-->>U: 処理完了通知
```

## 6. ガス計算とコストモデル

```mermaid
graph LR
    subgraph "Gas Components"
        TOTAL[Total Gas Cost]
        
        subgraph "Pre-verification"
            PRE[preVerificationGas]
            PRE1[Bundler Overhead]
            PRE2[Calldata Cost]
        end
        
        subgraph "Verification"
            VER[verificationGasLimit]
            VER1[Signature Verification]
            VER2[Paymaster Validation]
            VER3[Nonce Check]
        end
        
        subgraph "Execution"
            CALL[callGasLimit]
            CALL1[Target Contract Calls]
            CALL2[State Changes]
        end
        
        subgraph "Post-processing"
            POST[postOpGas]
            POST1[Paymaster Settlement]
            POST2[Event Emission]
        end
    end
    
    TOTAL --> PRE
    TOTAL --> VER  
    TOTAL --> CALL
    TOTAL --> POST
    
    PRE --> PRE1
    PRE --> PRE2
    VER --> VER1
    VER --> VER2
    VER --> VER3
    CALL --> CALL1
    CALL --> CALL2
    POST --> POST1
    POST --> POST2
    
    style TOTAL fill:#e1f5fe
    style PRE fill:#f3e5f5
    style VER fill:#e8f5e8
    style CALL fill:#fff3e0
    style POST fill:#fce4ec
```

### 各段階のガス消費
1. **Pre-verification**: UserOpのサイズ・複雑さに基づく
2. **Validation**: 署名検証、Paymaster検証
3. **Execution**: 実際のスマートコントラクト呼び出し  
4. **Post-op**: Paymaster の後処理

## 全体の相互作用

### 正常フロー
1. **ユーザー**: UserOperationを作成・署名
2. **Bundler**: UserOpを受信・検証・メンプール追加
3. **Bundler**: 複数UserOpをバンドルしてEntry Pointに送信
4. **Entry Point**: 各UserOpを順次検証・実行
5. **Wallet**: 署名検証後、実際の処理を実行
6. **Paymaster**: 必要に応じてガス代を代理支払い

### エラーハンドリング
- **検証失敗**: UserOpがリジェクトされる
- **実行失敗**: 個別のUserOpのみ失敗、他は継続
- **ガス不足**: Paymasterまたはユーザーの責任

## 学習での実装優先順位

1. **Simple Account Wallet**: 基本的な署名検証のみ
2. **Factory**: CREATE2でのウォレット展開
3. **Basic Bundler**: 単一UserOpの処理
4. **Simple Paymaster**: デポジット型の代理支払い
5. **Frontend Integration**: React UIでの操作
6. **Advanced Features**: マルチシグ、バッチ処理等