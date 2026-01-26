# 🆕 OS再インストール後の完全セットアップ手順

**対象サーバー**: yaku-navi.com (162.43.8.168)  
**作成日**: 2026年1月25日  
**所要時間**: 約1-2時間

---

## 🔑 重要な用語説明

### 「ユーザー名」について

このドキュメント内で「ユーザー名」と記載している部分は、**VPSサーバーにSSH接続する際のサーバー側のユーザー名**を指します。

#### OS再インストール後は通常 `root` です

```bash
# 例: rootユーザーで接続する場合
ssh root@yaku-navi.com
# または
ssh root@162.43.8.168
```

#### 一般的なパターン

| 状況 | ユーザー名 | 説明 |
|------|-----------|------|
| OS再インストール直後 | `root` | デフォルトでrootユーザー |
| 一般ユーザーを作成後 | `your-username` | 作成したユーザー名 |
| 既存のサーバー | `root` または作成済みユーザー | 現在の設定による |

#### 確認方法

VPSパネルまたはSSH接続情報で確認できます：
- VPSパネルの「SSH接続情報」
- サーバー提供元からの初期設定情報
- 既存のSSH接続設定

**このドキュメントでは、OS再インストール後のため `root` を使用することを前提としています。**

---

## 📋 概要

### OS再インストールのメリット

✅ **完全なリセット**
- システムレベルの問題を完全にクリア
- 不要なプロセスや設定を削除
- メモリリークやリソース問題を解消

✅ **クリーンな環境**
- 最新のOSとセキュリティパッチ
- 最適化された設定
- 不要なソフトウェアがない

✅ **502エラーの根本解決**
- システムレベルの問題を解消
- プロセス競合を解消
- リソース不足を解消

---

## ⚠️ 重要な注意事項

### 再インストール前に必ず実施

1. **データベースのバックアップ** ⚠️ **必須**
2. **環境変数の記録** ⚠️ **必須**
3. **現在の設定ファイルのバックアップ** ⚠️ **推奨**
4. **ドメイン設定の確認** ⚠️ **必須**

---

## 📦 Step 1: 再インストール前の準備（15分）

### 1-1. データベースのバックアップ

```bash
# サーバーにSSH接続
ssh ユーザー名@yaku-navi.com

# PostgreSQLバックアップ
pg_dump -U postgres pharmacy_platform > /tmp/pharmacy_platform_backup_$(date +%Y%m%d).sql

# バックアップファイルをダウンロード
scp ユーザー名@yaku-navi.com:/tmp/pharmacy_platform_backup_*.sql ./
```

### 1-2. 環境変数の記録

現在の環境変数を確認して記録：

```bash
# バックエンドの環境変数
cat /var/www/pharmacy-platform/backend/.env

# フロントエンドの環境変数（ある場合）
cat /var/www/pharmacy-platform/.env.local
```

**記録すべき環境変数:**
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- その他のAPIキーやシークレット

### 1-3. 現在の設定ファイルのバックアップ

```bash
# Nginx設定
sudo cp /etc/nginx/sites-available/default /tmp/nginx_backup.conf

# PM2設定
cp /var/www/pharmacy-platform/ecosystem.config.js /tmp/

# その他の設定ファイル
```

### 1-4. ドメイン設定の確認

- DNS設定が正しいか確認
- SSL証明書の情報を記録

---

## 🖥️ Step 2: OS再インストール（VPSパネルで実行）

### 2-1. サーバーを停止

1. VPSパネルにログイン
2. 右上の「電源操作」をクリック
3. 「シャットダウン」を実行
4. サーバーが完全に停止するまで待つ

### 2-2. OS再インストール

1. 左メニューから「OS再インストール」を選択
2. OSを選択（推奨: Ubuntu 22.04 LTS または最新のLTS）
3. 「再インストール」を実行
4. 完了まで待つ（10-20分）

### 2-3. サーバーを起動

1. 「電源操作」から「起動」を実行
2. サーバーが起動するまで待つ（5-10分）

---

## 🔧 Step 3: 初期セットアップ（30分）

### 3-1. SSH接続

#### 方法A: SSH鍵認証（推奨・既にSSH Keyが登録されている場合）

VPSパネルでSSH Keyが既に登録されている場合（例: "yakunavi"）、SSH鍵認証で接続できます：

```bash
# SSH鍵認証で接続（パスワード不要）
ssh root@162.43.8.168

# または
ssh root@yaku-navi.com
```

**SSH Keyが正しく設定されていれば、パスワードを求められずに接続できます。**

#### 方法B: パスワード認証

SSH Keyが設定されていない場合、またはパスワード認証を使用する場合：

```bash
# パスワード認証で接続
ssh root@162.43.8.168

# パスワードを求められたら、VPSパネルで確認したrootパスワードを入力
```

**注意**: 
- OS再インストール後は、VPSパネルでrootパスワードが再設定されている場合があります
- パスワードはVPSパネルの「パスワード変更」または「SSH接続情報」で確認できます
- SSH Keyが登録されている場合は、パスワード認証は不要です

#### SSH接続の確認

```bash
# 接続テスト
ssh -v root@yaku-navi.com

# 接続成功すると、以下のようなメッセージが表示されます：
# Welcome to Ubuntu...
```

### 3-2. システムの更新

```bash
# パッケージリストの更新
apt update

# システムのアップグレード
apt upgrade -y

# 必要なツールのインストール
apt install -y curl wget git build-essential
```

### 3-3. Node.jsのインストール

```bash
# Node.js 20.x LTSをインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# バージョン確認
node -v  # v20.x.x が表示されることを確認
npm -v
```

### 3-4. PM2のインストール

```bash
# PM2をグローバルにインストール
npm install -g pm2

# バージョン確認
pm2 -v
```

### 3-5. PostgreSQLのインストール

```bash
# PostgreSQLをインストール
apt install -y postgresql postgresql-contrib

# PostgreSQLを起動
systemctl start postgresql
systemctl enable postgresql

# バージョン確認
psql --version
```

### 3-6. Nginxのインストール

```bash
# Nginxをインストール
apt install -y nginx

# Nginxを起動
systemctl start nginx
systemctl enable nginx

# バージョン確認
nginx -v
```

---

## 💾 Step 4: データベースの復元（10分）

### 4-1. データベースの作成

```bash
# PostgreSQLに接続
sudo -u postgres psql

# データベースとユーザーを作成
CREATE DATABASE pharmacy_platform;
CREATE USER pharmacy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pharmacy_platform TO pharmacy_user;
\q
```

### 4-2. バックアップの復元

```bash
# バックアップファイルをアップロード（ローカルから）
# ユーザー名は通常 root（OS再インストール後）
scp pharmacy_platform_backup_*.sql root@yaku-navi.com:/tmp/

# サーバーで復元
sudo -u postgres psql pharmacy_platform < /tmp/pharmacy_platform_backup_*.sql
```

---

## 📁 Step 5: アプリケーションファイルのアップロード（15分）

### 5-1. プロジェクトディレクトリの作成

```bash
# ディレクトリを作成
mkdir -p /var/www/pharmacy-platform
cd /var/www/pharmacy-platform
```

### 5-2. ファイルのアップロード（ローカルから）

```bash
# プロジェクトルートから実行
cd /Users/soedakei/pharmacy-platform

# バックエンドをアップロード
# ユーザー名は通常 root（OS再インストール後）
rsync -avz --exclude 'node_modules' \
  backend/ root@yaku-navi.com:/var/www/pharmacy-platform/backend/

# フロントエンドをアップロード
rsync -avz --exclude 'node_modules' --exclude '.next' \
  app/ ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/app/
rsync -avz --exclude 'node_modules' \
  components/ ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/components/
rsync -avz --exclude 'node_modules' \
  lib/ ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/lib/
rsync -avz --exclude 'node_modules' \
  public/ ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/public/

# 設定ファイルをアップロード
scp package.json ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
scp package-lock.json ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
scp next.config.ts ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
scp tsconfig.json ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
scp ecosystem.config.js ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
scp tailwind.config.ts ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
scp postcss.config.mjs ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
```

### 5-3. 環境変数の設定

```bash
# サーバーにSSH接続
ssh ユーザー名@yaku-navi.com

# バックエンドの環境変数ファイルを作成
cd /var/www/pharmacy-platform/backend
nano .env
```

**`.env` ファイルの内容:**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://pharmacy_user:your_password@localhost:5432/pharmacy_platform
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=https://yaku-navi.com
```

### 5-4. 依存関係のインストール

```bash
# バックエンドの依存関係
cd /var/www/pharmacy-platform/backend
npm install --production

# フロントエンドの依存関係
cd /var/www/pharmacy-platform
npm install --production

# フロントエンドのビルド
npm run build
```

---

## 🚀 Step 6: PM2の設定と起動（10分）

### 6-1. PM2でアプリケーションを起動

```bash
cd /var/www/pharmacy-platform

# PM2で起動
pm2 start ecosystem.config.js

# ステータス確認
pm2 status
```

### 6-2. PM2設定の保存

```bash
# プロセスリストを保存
pm2 save

# サーバー起動時の自動起動を設定
pm2 startup systemd

# 表示されたコマンドを実行（例）
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

### 6-3. 動作確認

```bash
# ポート確認
netstat -tuln | grep -E '3000|3001'

# curlで確認
curl http://localhost:3001/
curl http://localhost:3001/health
curl http://localhost:3000/
```

---

## 🌐 Step 7: Nginxの設定（15分）

### 7-1. Nginx設定ファイルの作成

```bash
sudo nano /etc/nginx/sites-available/yaku-navi
```

**設定内容:**
```nginx
server {
    listen 80;
    server_name yaku-navi.com www.yaku-navi.com;

    # フロントエンド（Next.js）
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # バックエンドAPI
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ヘルスチェック
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 7-2. シンボリックリンクの作成

```bash
# 設定を有効化
sudo ln -s /etc/nginx/sites-available/yaku-navi /etc/nginx/sites-enabled/

# デフォルト設定を無効化（ある場合）
sudo rm /etc/nginx/sites-enabled/default

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
```

### 7-3. SSL証明書の設定（Let's Encrypt）

```bash
# Certbotをインストール
apt install -y certbot python3-certbot-nginx

# SSL証明書を取得
sudo certbot --nginx -d yaku-navi.com -d www.yaku-navi.com

# 自動更新の確認
sudo certbot renew --dry-run
```

---

## ✅ Step 8: 動作確認（10分）

### 8-1. ローカル確認

```bash
# PM2ステータス
pm2 status

# ログ確認
pm2 logs --lines 50

# ポート確認
netstat -tuln | grep -E '3000|3001|80|443'
```

### 8-2. ブラウザ確認

1. **https://yaku-navi.com** にアクセス
2. **https://yaku-navi.com/invoice-issued** にアクセス
3. **https://yaku-navi.com/api/health** にアクセス

### 8-3. 機能確認

- ✅ トップページが表示される
- ✅ 請求書発行ページが表示される
- ✅ ログインページが表示される
- ✅ APIが正常に動作する

---

## 🔍 Step 9: 監視設定（10分）

### 9-1. ヘルスチェックの確認

```bash
curl https://yaku-navi.com/api/health
```

### 9-2. Uptime Robotの設定（推奨）

1. https://uptimerobot.com にアクセス
2. 監視URL: `https://yaku-navi.com/api/health`
3. 間隔: 5分
4. メール通知設定

---

## 📋 セットアップチェックリスト

### システムセットアップ

- [ ] システムの更新完了
- [ ] Node.js 20.x インストール完了
- [ ] PM2 インストール完了
- [ ] PostgreSQL インストール完了
- [ ] Nginx インストール完了

### データベース

- [ ] データベース作成完了
- [ ] バックアップ復元完了
- [ ] 接続確認完了

### アプリケーション

- [ ] ファイルアップロード完了
- [ ] 環境変数設定完了
- [ ] 依存関係インストール完了
- [ ] フロントエンドビルド完了
- [ ] PM2起動完了

### サーバー設定

- [ ] Nginx設定完了
- [ ] SSL証明書設定完了
- [ ] ファイアウォール設定完了

### 動作確認

- [ ] トップページ表示確認
- [ ] API動作確認
- [ ] ヘルスチェック確認
- [ ] ログイン機能確認

---

## 🚨 トラブルシューティング

### エラー1: データベース接続エラー

```bash
# PostgreSQLの状態確認
sudo systemctl status postgresql

# 接続テスト
sudo -u postgres psql -c "SELECT version();"

# データベース確認
sudo -u postgres psql -l
```

### エラー2: PM2プロセスが起動しない

```bash
# ログを確認
pm2 logs --err --lines 50

# 手動で起動してエラーを確認
cd /var/www/pharmacy-platform/backend
node src/server.js
```

### エラー3: Nginx 502エラー

```bash
# Nginxエラーログを確認
sudo tail -f /var/log/nginx/error.log

# バックエンドが起動しているか確認
curl http://localhost:3001/

# PM2ステータス確認
pm2 status
```

### エラー4: ポートが使用中

```bash
# ポート使用状況確認
sudo lsof -i :3000
sudo lsof -i :3001

# プロセスを停止
sudo kill -9 PID
```

---

## 📊 OS再インストールの効果

### 解決される問題

1. ✅ **システムレベルの問題**
   - メモリリーク
   - リソース不足
   - プロセス競合

2. ✅ **設定の問題**
   - 不正な設定ファイル
   - 環境変数の不整合
   - パーミッション問題

3. ✅ **セキュリティの問題**
   - 古いセキュリティパッチ
   - 脆弱性の解消

4. ✅ **パフォーマンスの問題**
   - 不要なプロセスの削除
   - 最適化された環境

---

## 🎯 期待される効果

### 即座の効果

- ✅ 502エラーの完全解消
- ✅ クリーンな環境での動作
- ✅ 最新のセキュリティパッチ

### 中長期的な効果

- ✅ より安定した運用
- ✅ パフォーマンスの向上
- ✅ メンテナンス負荷の軽減

---

## 📚 関連ドキュメント

- `REDEPLOY_YAKU_NAVI.md` - 通常の再デプロイ手順
- `PM2_AUTO_RESTART_MONITORING.md` - 監視設定
- `502_ERROR_SOLUTION.md` - エラー対応

---

## 🎊 まとめ

### OS再インストールのメリット

✅ **完全なリセット** - システムレベルの問題を完全に解消  
✅ **クリーンな環境** - 最新のOSと最適化された設定  
✅ **根本的な解決** - 502エラーの原因を完全に解消  

### 実施すべきこと

1. **再インストール前**: データベースと環境変数のバックアップ
2. **再インストール後**: この手順に従って完全セットアップ
3. **動作確認**: 全ての機能が正常に動作することを確認

---

**準備完了です！OS再インストール後の完全セットアップが可能です！** 🚀

---

**作成者**: AI Assistant  
**作成日**: 2026年1月25日

