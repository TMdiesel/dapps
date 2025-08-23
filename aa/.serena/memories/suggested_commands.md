# 推奨コマンド一覧

## 開発セットアップ
```bash
# 依存関係のインストール
npm install

# プロジェクト初期化（必要に応じて）
npm init -y
```

## 開発中によく使うコマンド
```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# リント実行
npm run lint

# 型チェック
npm run typecheck

# ビルド
npm run build
```

## Git関連
```bash
# 状態確認
git status

# ステージング
git add .

# コミット（conventional commit形式）
git commit -m "feat: 新機能の実装"
git commit -m "fix: バグ修正"
git commit -m "refactor: リファクタリング"
```

## システム固有コマンド (macOS/Darwin)
```bash
# ファイル一覧
ls -la

# ディレクトリ移動
cd <path>

# ファイル検索
find . -name "*.ts"

# テキスト検索
grep -r "pattern" .
```

## タスク完了時の確認事項
1. `npm run lint` でリント確認
2. `npm run typecheck` で型チェック
3. `npm test` でテスト実行
4. `npm run build` でビルド確認
5. Git commitで変更をコミット

## 注意事項
- 現在はまだpackage.jsonがない状態
- セットアップ後は上記コマンドが利用可能になる予定
- Web3/ブロックチェーン関連の追加コマンドが今後必要になる可能性あり