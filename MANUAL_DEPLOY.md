# yaku-navi.com 手動デプロイ手順

## 前提条件
- サーバーにSSH接続できること
- サーバー上でPM2がインストールされていること

## デプロイ手順

### 1. サーバーにSSH接続
```bash
ssh pharmacy@yaku-navi.com
```
パスワード: `Pharm@cy2025!Secure#VPS`

### 2. プロジェクトディレクトリに移動
```bash
cd ~/pharmacy-platform
```

### 3. 最新コードを取得
```bash
git pull origin main
```

### 4. 依存関係を更新（必要に応じて）
```bash
npm install
```

### 5. アプリケーションをビルド
```bash
npm run build
```

### 6. PM2でフロントエンドを再起動
```bash
pm2 restart pharmacy-frontend
```

### 7. デプロイ確認
```bash
pm2 status
pm2 logs pharmacy-frontend --lines 30
```

### 8. ブラウザで確認
https://yaku-navi.com/ にアクセスして、変更が反映されているか確認してください。

## トラブルシューティング

### ビルドエラーが発生した場合
```bash
# キャッシュをクリア
rm -rf .next
npm run build
```

### PM2が起動しない場合
```bash
# PM2のステータスを確認
pm2 status

# 手動で起動
pm2 start npm --name "pharmacy-frontend" -- start
```

### ログを確認
```bash
pm2 logs pharmacy-frontend
```

