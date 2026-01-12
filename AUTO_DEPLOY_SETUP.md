# 🚀 自動デプロイ設定ガイド

GitHub Actionsを使用して、コードをプッシュするたびに自動的にVPSにデプロイする設定方法です。

## 📋 設定手順

### Step 1: SSH秘密鍵をGitHub Secretsに登録

1. GitHubリポジトリにアクセス
   - https://github.com/Keeeeei-Soeda/pharmacy-platform

2. **Settings** → **Secrets and variables** → **Actions** に移動

3. **New repository secret** をクリック

4. 以下の情報を入力：
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: SSH秘密鍵の内容（以下のコマンドで取得）

```bash
cat ~/.ssh/id_ed25519
```

5. **Add secret** をクリック

### Step 2: 設定の確認

`.github/workflows/deploy.yml` ファイルが正しく作成されているか確認：

```bash
cat .github/workflows/deploy.yml
```

### Step 3: 動作テスト

1. 何か小さな変更を加える（例：README.mdにコメント追加）

2. GitHubにプッシュ：
```bash
git add .
git commit -m "test: 自動デプロイのテスト"
git push origin main
```

3. GitHubの **Actions** タブでデプロイの進行状況を確認

## 🔄 自動デプロイの動作

### トリガー
- `main` ブランチにプッシュした時
- GitHubのActionsタブから手動実行（`workflow_dispatch`）

### 実行内容
1. ✅ 最新コードを取得（`git pull`）
2. ✅ 依存関係をインストール（`npm install`）
3. ✅ フロントエンドをビルド（`npm run build`）
4. ✅ バックエンドの依存関係を更新
5. ✅ Prismaマイグレーション実行
6. ✅ PM2でアプリケーション再起動

## 📊 デプロイ状況の確認

### GitHub Actionsで確認
- リポジトリの **Actions** タブから確認
- 緑色のチェックマーク = 成功 ✅
- 赤色のX = 失敗 ❌

### サーバー上で確認
```bash
ssh -i ~/.ssh/id_ed25519 pharmacy@yaku-navi.com
pm2 list
pm2 logs pharmacy-frontend --lines 20
pm2 logs pharmacy-backend --lines 20
```

## 🔧 トラブルシューティング

### SSH接続エラー
- GitHub Secretsに正しくSSH鍵が登録されているか確認
- `SSH_PRIVATE_KEY` という名前が正確か確認

### デプロイ失敗
- GitHub Actionsのログを確認
- サーバー上のログを確認：
  ```bash
  pm2 logs pharmacy-frontend --err
  pm2 logs pharmacy-backend --err
  ```

### 手動デプロイが必要な場合
```bash
bash deploy.sh
```

## 🎯 ベストプラクティス

1. **テストブランチでテスト**
   - `main` ブランチに直接プッシュする前に、別ブランチでテスト

2. **コミットメッセージを明確に**
   - 何を変更したか分かるように

3. **デプロイ前の確認**
   - ローカルで動作確認してからプッシュ

4. **ログの定期確認**
   - デプロイ後は必ずログを確認

## 📝 注意事項

- ⚠️ SSH秘密鍵は絶対にGitリポジトリにコミットしない
- ⚠️ `.env` ファイルもコミットしない（既に`.gitignore`に含まれています）
- ⚠️ 本番環境のデータベースを直接操作する場合は注意

