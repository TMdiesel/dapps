# Mermaid図表設計ルール

## Action vs Entity の明確な分離

### 基本原則
- **Entity（実体）**: ノード（四角・円）に配置 - 物理的・論理的に存在するコンポーネント
- **Action（処理）**: エッジ（線・矢印）に配置 - 動作、処理、機能、データの流れ

### 表記ルール

#### Entity（実体）の表記
- **配置**: ノード（四角、円、菱形）
- **形状**: `[角括弧]`, `(丸括弧)`, `((円))`, `{菱形}`
- **命名**: 名詞形（〜Engine, 〜Storage, 〜Contract, 〜Manager）
- **例**: `[Simulation Engine]`, `[Mempool Storage]`, `(Entry Point Contract)`

#### Action（処理）の表記  
- **配置**: エッジ（矢印線）のラベル
- **命名**: 動詞形（検証, 実行, 送信, validate, execute, send）
- **例**: `A -->|検証| B`, `C -->|UserOp送信| D`

### 改良例

#### Before（混在）:
```mermaid
subgraph "Validation Layer"
    PRE[Pre-validation]     # Action がノードに
    SIM[Simulation Engine]  # Entity
    GAS[Gas Estimation]     # Action がノードに
end
PRE --> SIM --> GAS
```

#### After（分離）:
```mermaid
subgraph "Validation Layer"
    VALIDATOR[Validator]
    SIM_ENGINE[Simulation Engine] 
    GAS_CALC[Gas Calculator]
end

VALIDATOR -->|事前検証| SIM_ENGINE
SIM_ENGINE -->|ガス見積もり| GAS_CALC
```

## フロー図での関係性表現

### 基本パターン
```mermaid
graph LR
    A[Entity A] -->|Action 1| B[Entity B]
    B -->|Action 2| C[Entity C]
    C -->|Action 3| A
```

### 複雑な処理フロー
```mermaid
graph TD
    USER[User] -->|操作要求| FRONTEND[Frontend]
    FRONTEND -->|UserOp作成| BUNDLER[Bundler]
    BUNDLER -->|事前検証| VALIDATOR[Validator]
    VALIDATOR -->|シミュレーション| SIM_ENGINE[Simulation Engine]
    SIM_ENGINE -->|検証結果| BUNDLER
    BUNDLER -->|メンプール追加| MEMPOOL[Mempool]
    MEMPOOL -->|UserOp選択| OPTIMIZER[MEV Optimizer]
    OPTIMIZER -->|バンドル作成| BUNDLER
    BUNDLER -->|handleOps呼び出し| ENTRY_POINT[Entry Point]
```

## 条件分岐の表現

### 判定ロジックもエッジに
```mermaid
graph TD
    BUNDLER[Bundler] -->|UserOp受信| VALIDATOR{Validator}
    VALIDATOR -->|検証成功| MEMPOOL[Mempool]
    VALIDATOR -->|検証失敗| ERROR[Error Handler]
    MEMPOOL -->|最適化| OPTIMIZER[Optimizer]
```

## シーケンス図でのAction表現

### メッセージ = Action
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Bundler
    participant E as EntryPoint
    
    U->>F: 操作要求
    F->>F: UserOp構築
    F->>B: UserOp送信
    B->>B: 事前検証
    B->>E: シミュレーション実行
    E-->>B: 検証結果
    B->>B: メンプール追加
```

## 色分けルール

### Entity
- **Core Components**: `fill:#e3f2fd` 
- **Data Storage**: `fill:#e8f5e8`
- **External Systems**: `fill:#fff3e0`
- **Contracts**: `fill:#f3e5f5`
- **Error/Alert**: `fill:#ffebee`

### Action（エッジスタイル）
- **Normal Flow**: 実線矢印
- **Error Flow**: 点線矢印 `-.->` 
- **Optional Flow**: 波線矢印
- **Heavy Processing**: 太線矢印

## Bundler アーキテクチャ改良例

### Before:
```mermaid
subgraph "Bad: Action in Nodes"
    API[API Server]
    PRE[Pre-validation]
    SIM[Simulation]
    MEMPOOL[Mempool]
end
```

### After:
```mermaid
graph TD
    subgraph "Bundler Components"
        API[API Server]
        VALIDATOR[Validator]
        SIM_ENGINE[Simulation Engine]
        MEMPOOL[Mempool Storage]
        OPTIMIZER[MEV Optimizer]
        TX_BUILDER[Transaction Builder]
    end
    
    API -->|UserOp受信| VALIDATOR
    VALIDATOR -->|事前検証| SIM_ENGINE
    SIM_ENGINE -->|実行シミュレーション| VALIDATOR
    VALIDATOR -->|検証完了| MEMPOOL
    MEMPOOL -->|UserOp選択| OPTIMIZER
    OPTIMIZER -->|MEV最適化| TX_BUILDER
    TX_BUILDER -->|バンドル作成| API
    
    style API fill:#e3f2fd
    style VALIDATOR fill:#fff0e1
    style SIM_ENGINE fill:#e8f5e8
    style MEMPOOL fill:#e8f5e8
    style OPTIMIZER fill:#fff3e0
    style TX_BUILDER fill:#f3e5f5
```

## Paymaster フロー改良例

### Before:
```mermaid
graph TD
    VALIDATE[validatePaymasterUserOp]
    CONTEXT[Context Generation]
    PREPAY[Pre-payment]
```

### After:
```mermaid
graph TD
    ENTRY_POINT[Entry Point] -->|validatePaymasterUserOp呼び出し| PAYMASTER[Paymaster Contract]
    PAYMASTER -->|資格確認| AUTH_ENGINE[Authorization Engine] 
    AUTH_ENGINE -->|認証結果| PAYMASTER
    PAYMASTER -->|コンテキスト生成| ENTRY_POINT
    ENTRY_POINT -->|事前ガス徴収| PAYMASTER
    PAYMASTER -->|ガス代預かり| GAS_RESERVE[Gas Reserve]
```

## 禁止パターン

❌ **Action をノードに配置**
```mermaid
graph TD
    A[Component] --> B[Validation] --> C[Component]
    # Validation は処理なのでノードにすべきでない
```

✅ **Action をエッジに配置**  
```mermaid
graph TD
    A[Component] -->|validation| C[Component]
    # validation は処理なのでエッジラベルに
```

❌ **Entity をエッジに配置**
```mermaid
graph TD
    A -->|Database| B
    # Database は実体なのでエッジにすべきでない
```

✅ **Entity をノードに配置**
```mermaid
graph TD
    A[Component A] -->|データ書き込み| B[Database]
    # Database は実体なのでノードに
```

## 適用ガイドライン

### 1. ノードの判定
- 「これは物理的・論理的に存在するか？」→ Yes なら Entity
- 「これはデータを保存・処理するか？」→ Yes なら Entity

### 2. エッジの判定  
- 「これは動作・処理か？」→ Yes なら Action
- 「これは何かから何かへの流れか？」→ Yes なら Action

### 3. 迷った時のルール
- 名詞なら Entity → ノード
- 動詞なら Action → エッジ
- 「〜ing」なら Action → エッジ

## メモリーバンク適用

このルールは今後作成する全Mermaid図に適用し、既存図表も順次このパターンで更新する。特に：

- `research/aa_components_detailed.md` のBundler図
- 全体アーキテクチャ図
- UserOperationフロー図

を優先的に改良する。