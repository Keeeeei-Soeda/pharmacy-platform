# Xserver VPS デプロイガイド

## 🎯 前提条件

- Xserver VPS契約済み
- SSH接続情報（IPアドレス、ポート、ユーザー名、パスワード）
- ドメイン（オプション）

---

## 📦 必要なもの

1. **サーバー環境**
   - Ubuntu 20.04 / 22.04 (推奨)
   - Node.js 18.x 以上
   - PostgreSQL 15.x 以上
   - Nginx (リバースプロキシ用)
   - PM2 (プロセス管理)

2. **ローカル環境**
   - FileZilla または WinSCP (FTP/SFTPクライアント)
   - SSH クライアント (ターミナル or PuTTY)

---

## 🚀 デプロイ手順

### Step 1: SSH接続

```bash
# ターミナルから接続
ssh root@あなたのサーバーIP -p ポート番号

# 初回ログイン後、作業用ユーザー作成（推奨）
adduser pharmacy
usermod -aG sudo pharmacy
su - pharmacy
```

---

### Step 2: 必要なソフトウェアのインストール

```bash
# システムアップデート
sudo apt update && sudo apt upgrade -y

# Node.js 18.x インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL インストール
sudo apt install -y postgresql postgresql-contrib

# Nginx インストール
sudo apt install -y nginx

# PM2 インストール（プロセス管理）
sudo npm install -g pm2

# Git インストール
sudo apt install -y git

# 確認
node --version  # v18.x.x 以上
npm --version
psql --version  # 15.x 以上
```

---

### Step 3: PostgreSQL データベースセットアップ

```bash
# PostgreSQL にログイン
sudo -u postgres psql

# データベースとユーザー作成
CREATE DATABASE pharmacy_db;
CREATE USER pharmacy_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pharmacy_db TO pharmacy_user;

# 拡張機能を有効化
\c pharmacy_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# 終了
\q
```

---

### Step 4: アプリケーションのデプロイ

#### 方法A: Git経由（推奨）

```bash
# ホームディレクトリに移動
cd ~

# リポジトリをクローン
git clone https://github.com/Keeeeei-Soeda/pharmacy-platform.git
cd pharmacy-platform

# 依存パッケージのインストール
npm install
cd backend
npm install
cd ..
```

#### 方法B: FTP/SFTP経由

1. **FileZilla を使用**:
   - プロトコル: SFTP
   - ホスト: あなたのサーバーIP
   - ポート: SSHポート番号
   - ユーザー名: pharmacy (または作成したユーザー)
   - パスワード: 設定したパスワード

2. **ローカルの pharmacy-platform フォルダ全体をアップロード**
   - アップロード先: `/home/pharmacy/pharmacy-platform`

3. **SSH接続して依存パッケージをインストール**:
```bash
cd ~/pharmacy-platform
npm install
cd backend
npm install
cd ..
```

---

### Step 5: 環境変数の設定

```bash
# バックエンド環境変数
cd ~/pharmacy-platform/backend
nano .env
```

以下の内容を記入：

```env
# データベース接続
DATABASE_URL=postgresql://pharmacy_user:your_secure_password@localhost:5432/pharmacy_db

# JWT設定
JWT_SECRET=your_very_secure_random_string_here_min_32_chars
JWT_EXPIRES_IN=7d

# サーバー設定
PORT=3001
NODE_ENV=production

# フロントエンドURL
FRONTEND_URL=http://あなたのドメインまたはIP

# メール設定（SendGrid等を使用する場合）
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

保存して終了（Ctrl + X → Y → Enter）

```bash
# フロントエンド環境変数
cd ~/pharmacy-platform
nano .env.local
```

以下の内容を記入：

```env
# バックエンドAPI URL
NEXT_PUBLIC_API_URL=http://あなたのドメインまたはIP:3001/api
```

保存して終了

---

### Step 6: Prismaのセットアップとマイグレーション

```bash
cd ~/pharmacy-platform/backend

# Prismaクライアント生成
npx prisma generate

# データベースマイグレーション実行（任意）
# ※ スキーマが既にDB側にある場合はスキップ
# npx prisma db push
```

---

### Step 7: フロントエンドのビルド

```bash
cd ~/pharmacy-platform
npm run build
```

---

### Step 8: PM2でアプリケーションを起動

```bash
# PM2設定ファイルを作成
cd ~/pharmacy-platform
nano ecosystem.config.js
```

以下の内容を記入：

```javascript
module.exports = {
  apps: [
    {
      name: 'pharmacy-backend',
      cwd: './backend',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'pharmacy-frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      }
    }
  ]
};
```

保存して終了

```bash
# PM2でアプリケーションを起動
pm2 start ecosystem.config.js

# 起動確認
pm2 status

# ログ確認
pm2 logs

# サーバー再起動時に自動起動設定
pm2 startup
pm2 save
```

---

### Step 9: Nginxのリバースプロキシ設定

```bash
# Nginx設定ファイルを作成
sudo nano /etc/nginx/sites-available/pharmacy-platform
```

以下の内容を記入：

```nginx
server {
    listen 80;
    server_name あなたのドメインまたはIP;

    # フロントエンド
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # バックエンドAPI
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ファイルアップロード用
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 10M;
    }
}
```

保存して終了

```bash
# シンボリックリンク作成
sudo ln -s /etc/nginx/sites-available/pharmacy-platform /etc/nginx/sites-enabled/

# デフォルト設定を無効化
sudo rm /etc/nginx/sites-enabled/default

# Nginx設定テスト
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx

# Nginx自動起動設定
sudo systemctl enable nginx
```

---

### Step 10: ファイアウォール設定

```bash
# UFWファイアウォールを設定
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS（SSL設定時）
sudo ufw enable
sudo ufw status
```

---

## ✅ デプロイ完了確認

```bash
# アプリケーションの状態確認
pm2 status

# ログ確認
pm2 logs pharmacy-backend
pm2 logs pharmacy-frontend

# Webブラウザでアクセス
# http://あなたのサーバーIP
```

---

## 🔄 更新・再デプロイ手順

```bash
# SSH接続
ssh pharmacy@あなたのサーバーIP

# アプリケーションディレクトリに移動
cd ~/pharmacy-platform

# 最新コードを取得（Git使用時）
git pull origin main

# 依存パッケージを更新
npm install
cd backend
npm install
cd ..

# フロントエンドを再ビルド
npm run build

# PM2でアプリケーションを再起動
pm2 restart all

# または個別に再起動
pm2 restart pharmacy-backend
pm2 restart pharmacy-frontend

# ログ確認
pm2 logs
```

---

## 🔒 SSL証明書の設定（Let's Encrypt）

```bash
# Certbot インストール
sudo apt install -y certbot python3-certbot-nginx

# SSL証明書取得
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自動更新設定確認
sudo certbot renew --dry-run
```

---

## 🐛 トラブルシューティング

### アプリケーションが起動しない

```bash
# PM2ログ確認
pm2 logs

# バックエンドログ
pm2 logs pharmacy-backend

# フロントエンドログ
pm2 logs pharmacy-frontend

# プロセス再起動
pm2 restart all
```

### データベース接続エラー

```bash
# PostgreSQL状態確認
sudo systemctl status postgresql

# PostgreSQLログ確認
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# 接続テスト
psql -U pharmacy_user -d pharmacy_db -h localhost
```

### ポート確認

```bash
# 使用中のポート確認
sudo netstat -tulpn | grep LISTEN

# 3001と3005が使用されているか確認
sudo lsof -i :3001
sudo lsof -i :3005
```

---

## 📊 監視とメンテナンス

```bash
# PM2モニタリング
pm2 monit

# リソース使用状況
pm2 status
top
df -h

# ログローテーション設定
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔐 セキュリティ推奨事項

1. **SSH設定の強化**
   - ポート番号変更
   - パスワード認証無効化（公開鍵認証のみ）
   - rootログイン無効化

2. **環境変数の保護**
   - `.env`ファイルのパーミッション設定
   ```bash
   chmod 600 ~/pharmacy-platform/backend/.env
   chmod 600 ~/pharmacy-platform/.env.local
   ```

3. **定期的なアップデート**
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm update -g npm
   pm2 update
   ```

4. **バックアップ設定**
   ```bash
   # データベースバックアップ
   pg_dump -U pharmacy_user pharmacy_db > backup_$(date +%Y%m%d).sql
   ```

---

## 📞 サポート

問題が発生した場合：
1. PM2ログを確認
2. Nginxログを確認: `sudo tail -f /var/log/nginx/error.log`
3. PostgreSQLログを確認
4. システムログを確認: `sudo journalctl -xe`

---

**作成日**: 2025-12-13  
**最終更新**: 2025-12-13

