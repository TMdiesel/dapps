これは Next.js と Tailwind を用いた AA Managed Demo の UI です。ソーシャルログインに Web3Auth を統合しており、次のステップとして Alchemy Account Kit による Account Abstraction を組み込みます。

## はじめに

まず環境変数を設定し、その後開発サーバーを起動します。

1. 環境変数テンプレートをコピーして値を設定

```bash
cp .env.example .env
```

必須の環境変数

- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`（Web3Auth ダッシュボード）
- `NEXT_PUBLIC_ALCHEMY_API_KEY` または `NEXT_PUBLIC_ALCHEMY_RPC_URL`
- `NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID`（任意・ガススポンサー用）
- `NEXT_PUBLIC_DEFAULT_CHAIN_ID`（デフォルト: Sepolia の `11155111`）

2. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、画面を確認できます。

`src/app/page.tsx` を編集するとページを変更できます。ファイルを保存すると自動で更新されます。

このプロジェクトは [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) を使用して、Vercel の新しいフォントファミリーである [Geist](https://vercel.com/font) を自動的に最適化・読み込みします。

## キーの取得（Web3Auth / Alchemy）

### Web3Auth Client ID

1. Web3Auth ダッシュボード（https://dashboard.web3auth.io/）へアクセスします。
2. 新しいプロジェクト（Modal SDK）を作成し、発行された Client ID をコピーします。
3. ローカル開発では必要に応じて Allowed Origins/Redirect URLs にオリジンやリダイレクト URL を追加します。例：
   - Allowed Origins: `http://localhost:3000`
   - Redirect URL（リダイレクトフローを使う場合）: `http://localhost:3000`
4. `.env` の `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` に Client ID を設定します。

補足

- このアプリは Modal SDK を使ったポップアップ UX です。本番では `web3AuthNetwork` の設定と本番ドメインのホワイトリスト登録を検討してください。

### Alchemy API Key（および RPC URL）

1. Alchemy（https://dashboard.alchemy.com/）にアクセスします。
2. Network を Ethereum Sepolia（または対象チェーン）にした App を作成します。
3. 作成した App から API Key または HTTPS RPC URL をコピーします。
4. `.env` に以下のいずれかを設定します：
   - `NEXT_PUBLIC_ALCHEMY_API_KEY=...`（アプリでは `https://eth-sepolia.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}` を使用）
   - もしくは `NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/XXXX` を直接設定

### Alchemy Gas Manager Policy ID（任意・ガススポンサー用）

1. Alchemy ダッシュボードで Account Kit → Gas Manager を開きます。
2. 対象ネットワーク（例：Sepolia）向けに新しい Policy を作成します。
3. Policy ID をコピーし、`.env` の `NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID` に設定します。
4. UI の “Sponsor” トグルで、スポンサー付きの UserOp を有効/無効にできます（次のステップで Account Kit と連動）。

### テストネット ETH（Sepolia）

- Faucet（例： https://sepoliafaucet.com/）からテスト ETH を取得してください。スポンサー付きでも一部のフローでは多少の残高が必要になる場合があります。

## ロードマップ（MVP）

- Web3Auth ログイン（完了）：モーダルのポップアップログイン、アドレス/チェーン表示。
- Alchemy Account Kit（進行中）：Light Smart Account の初期化（ページの「Initialize Smart Account」ボタン）。
- Sponsor（Gas Manager）：UI にトグルあり。Policy ID 設定後に連動予定。
- 残高/NFT：Alchemy API で取得して表示。
- 送金：スポンサーの有無を切り替え可能な ETH/ERC20 送金、UserOp ハッシュとエクスプローラへのリンク表示。

## Account Kit の使用（プレビュー）

- ログイン後、ダッシュボードの「Initialize Smart Account」をクリックすると Light Smart Account を初期化します。
- 成功すると「Smart Account」にアドレスが表示されます（Sepolia）。
- Sponsor トグルを使う場合は、先に `NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID` を設定してください（送金機能と併せて有効化予定）。

### 送金（ETH）

- Recipient と Amount（ETH）を入力し「Send ETH (AA)」を押すと、Account Abstraction 経由で送金します。
- 送金前に Smart Account が未初期化の場合は自動で初期化します。
- 送金結果の Tx Hash は（Sepolia の）Etherscan リンクで確認できます。

注：ガススポンサー（Gas Manager）連動は次のステップで組み込みます。Policy ID の設定が必要です。

## トラブルシューティング（開発サーバー）

- `.next/static/development/_buildManifest.js.tmp.*` 配下で ENOENT エラーが出る場合は次を試してください：
  1. 開発サーバーを停止
  2. `npm run clean` を実行して `.next` を削除
  3. `npm run dev` を再実行
- それでも改善しない場合は Turbopack を使わずに実行（Webpack にフォールバック）：
  - `npm run dev:webpack`
  - あるいは本番モードでビルド＋起動：`npm run build:webpack && npm run start`

## 参考資料

Next.js の詳細は以下を参照してください：

- [Next.js Documentation](https://nextjs.org/docs) - 機能や API の解説。
- [Learn Next.js](https://nextjs.org/learn) - インタラクティブなチュートリアル。

[Next.js の GitHub リポジトリ](https://github.com/vercel/next.js) も参照できます。フィードバックやコントリビューションは歓迎です。

## Vercel へのデプロイ

Next.js の作者による [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) を使うのが、Next.js アプリをデプロイする最も簡単な方法です。

詳細は [Next.js のデプロイドキュメント](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
