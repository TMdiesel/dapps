# Web3Auth × Alchemy Account Kit デモ UI 仕様・設計

## ゴール

- ユーザーがメール/Google 等でログインし、スマートアカウント（AA）を自動生成。
- Paymaster（Gas Manager）でガス代をスポンサー可能なトランザクションを体験。
- 残高表示・送金・NFT 表示など基本機能をシンプル UI で提供。
- 実装と検証が容易、拡張しやすいフロントエンド構成。

## ユーザーフロー

1. ログイン: Web3Auth モーダルで SSO/Magic Link → セッション確立。
2. アカウント作成: Alchemy Account Kit で Light Smart Account を作成（ERC-4337）。
3. ダッシュボード: アドレス・チェーン・残高・NFT の一覧表示。
4. アクション: ETH/ERC20 送金（スポンサー有/無の切替）、メッセージ署名、UserOp 送信。
5. ログアウト: セッション破棄、UI 初期化。

## MVP 機能

- 認証: Web3Auth Modal（OpenLogin/MPC）、EVM チェーン（例: Sepolia）。
- アカウント: LightSmartContractAccount（Alchemy Account Kit）。
- ガス: Alchemy Gas Manager によるスポンサー送信の ON/OFF トグル。
- 表示: アドレス、チェーン、ネイティブ/トークン残高、簡易 NFT 一覧。
- 送金: ETH および事前指定の ERC20 トークン送金。
- 署名: SIWE 風のメッセージ署名と（ローカル）検証。

## 非機能要件

- パフォーマンス: 初回ロードを軽量化、ログイン後に SDK 読み込み。
- 安全性: 秘密鍵は Web3Auth に委譲、アプリ側で保管しない。
- レジリエンス: RPC/バンドラー/ペイマスターのエラーハンドリング。
- 可観測性: 基本イベントログ（auth 開始/成功/失敗、送金成功/失敗）。

## 技術スタック

- フロント: React + TypeScript（Vite/Next.js。MVP は Vite 推奨）。
- UI: Headless UI + Tailwind or Chakra（任意）。
- Web3: Alchemy Account Kit（`@alchemy/aa-*` + `@alchemy/aa-viem` もしくは `aa-ethers`）。
- 認証: Web3Auth Modal（`@web3auth/modal` + `@web3auth/openlogin-adapter`）。
- 補助: Alchemy SDK（NFT/Balance 取得の簡便化、必要に応じて）。

## アーキテクチャ（高レベル）

- 認証層: Web3Auth → SmartAccountSigner（鍵は SDK 管理）。
- AA 層: Account Kit で Bundler + LightSmartAccount を構築、`withAlchemyGasManager`を条件付与。
- Web3 クライアント: viem（推奨）または ethers で統一。
- データ取得: Alchemy API で NFT/トークンメタ等を補助取得。
- 状態管理: React Query + 軽量グローバル（zustand）で接続状態/フラグを管理。

## 主要統合ポイント

### Web3Auth

- クライアント ID、プロバイダ設定（Google/Email 等）。
- `chainId` と RPC は Alchemy の HTTPS を使用。

### Account Kit

- `LightSmartContractAccount` 採用、Bundler は Alchemy。
- Gas Manager の Policy ID を設定し、スポンサー有効化トグルを UI に表示。

### チェーン/ネットワーク

- MVP は `sepolia` 固定（将来は `polygon amoy` 等を追加可能）。

## 画面・コンポーネント

- Landing: ログインボタン、説明、テストネット注意。
- Dashboard:
  - アカウントカード（アドレス、QR、チェーン、コピー）。
  - 残高カード（ETH、選択トークンサマリ）。
  - NFT グリッド（画像・名前・コレクション）。
  - アクションパネル（送金フォーム、スポンサー切替、送信・結果表示）。
  - 開発者パネル（Tx/UserOp ログ、署名デモ）。
- Header: Connect/Disconnect、ネットワーク表示、テーマ切替。
- Modals: 送金、署名、エラー詳細。

## 状態・データフロー

- `authState`: loggedIn, userInfo, web3authProvider。
- `smartAccount`: address, initStatus, sponsorEnabled。
- `networkState`: chainId, rpcUrl。
- `balances/nfts`: React Query でフェッチ、auth/chain に依存して再取得。
- `txState`: 進行中/成功/失敗、UserOp hash、explorer リンク。

## 環境変数（例: Vite）

- `VITE_ALCHEMY_API_KEY`
- `VITE_ALCHEMY_GAS_MANAGER_POLICY_ID`（スポンサーを使う場合）
- `VITE_WEB3AUTH_CLIENT_ID`
- `VITE_DEFAULT_CHAIN_ID`（例: 11155111 for Sepolia）
- `VITE_ALCHEMY_RPC_URL`（`https://eth-sepolia.g.alchemy.com/v2/${KEY}`）

## セキュリティ/運用

- キー管理: クライアント側公開変数のみ（秘密は扱わない）。
- セッション: Web3Auth のセッション再開を活用、期限切れ時の再ログイン導線。
- 失敗時 UX: 明確なエラー分類と表示（RPC/バンドラー/ペイマスター/残高不足/レート制限）。
- ログ: 控えめなクライアントログ（PII を含めない）。

## テスト方針

- ユニット: 初期化アダプタ（スポンサー有無、チェーン切替）をモックで検証。
- 結合: ダッシュボードのフェッチ/送金ハッピーパス。
- 手動: Sepolia で AA 作成 → 送金（スポンサー ON/OFF）→ NFT 表示 → 署名。

## 拡張アイデア（Nice to have）

- セッションキー（限定権限・期限付き）デモ。
- バッチトランザクション、トークン許可の最適化。
- 追加チェーン、テーマ切替、i18n（日本語/英語）。
- SIWE + サーバー検証（Next.js API）での dApp ログイン。

## 想定パッケージ

- `@web3auth/modal`, `@web3auth/openlogin-adapter`
- `@alchemy/aa-core`, `@alchemy/aa-accounts`, `@alchemy/aa-viem`（or `aa-ethers`）
- `viem`, `@tanstack/react-query`, `zustand`, `zod`
- UI ライブラリ（Tailwind + Radix/HeadlessUI など）

## 未確定事項（要確認）

- ターゲットチェーン: Sepolia で OK か、他の希望は？
- ガススポンサー: 常時 ON か、UI で切替？
- ログイン手段: Google + Email で十分か？
- トークン/NFT 対象: デモ用に特定のコレクション/トークンの希望？
- フレームワーク: Next.js or Vite（既存 `aa-managed` に合わせる）。

## 実装順序（MVP ロードマップ）

1. Vite/Next スキャフォールド + 環境変数テンプレート作成。
2. Web3Auth 接続（ログイン/ログアウト、セッション再開）。
3. Account Kit 初期化（Light SCA + Bundler）。
4. Gas Manager 連携（スポンサー ON/OFF トグル）。
5. 残高/NFT 表示（Alchemy API）。
6. 送金（ETH/ERC20）と UserOp 可視化。
7. 署名デモ（SIWE 風）と検証。
8. エラーハンドリング・UX 整備・簡易ログ。

---

このドキュメントは MVP のための最小仕様です。未確定事項の回答に合わせて更新します。
