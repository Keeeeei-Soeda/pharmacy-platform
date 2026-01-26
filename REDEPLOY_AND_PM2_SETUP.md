# 🚀 yaku-navi.com 再アップロード & PM2自動起動設定ガイド

**最終更新日**: 2026年1月26日  
**対象サーバー**: yaku-navi.com (162.43.8.168)  
**所要時間**: 約30-40分

---

## 📋 目次

1. [概要](#概要)
2. [502エラーの要因と分析](#502エラーの要因と分析)
3. [事前準備](#事前準備)
4. [ファイルアップロード](#ファイルアップロード)
5. [依存関係のインストールとビルド](#依存関係のインストールとビルド)
6. [データベース接続の修正](#データベース接続の修正)
7. [PM2プロセスの再起動](#pm2プロセスの再起動)
8. [PM2自動起動設定](#pm2自動起動設定)
9. [動作確認](#動作確認)
10. [トラブルシューティング](#トラブルシューティング)

---

## 📋 概要

### このガイドの目的

yaku-navi.comサーバーへの再アップロードと、PM2の自動起動設定を実施するための手順書です。

### 実施内容

1. ✅ プロジェクトファイルのアップロード
2. ✅ 依存関係のインストール（devDependencies含む）
3. ✅ フロントエンドのビルド
4. ✅ データベース接続の修正
5. ✅ PM2プロセスの再起動
6. ✅ PM2自動起動設定（systemd）
7. ✅ ドメインでのアクセステスト

---

## 🚨 502エラーの要因と分析

### 背景と状況

#### 発生していた問題

- **エラー**: 502 Bad Gateway
- **発生頻度**: 1週間で2回
- **影響**: サイト全体がアクセス不可
- **判定**: **異常な頻度**（正常な状態の約8倍）

#### 正常と異常の判定基準

| 項目 | 正常な頻度 | 異常な頻度（当時の状況） |
|------|-----------|----------------------|
| サーバー再起動 | 月1〜2回程度 | - |
| PM2停止 | 月1回以下（再起動時のみ） | **1週間で2回** ⚠️ |
| 502エラー | 月1回以下（再起動時のみ） | **1週間で2回** ⚠️ |

**判定基準**:
- 月に2回以上のPM2停止 → 要調査
- 週に1回以上のPM2停止 → 異常（早急に対策が必要）
- **週に2回以上のPM2停止 → 深刻な問題あり**

---

### 502エラーの主な要因

#### 1. PM2プロセスが停止している（最も一般的）

**症状**:
- `pm2 status`でプロセスが`stopped`または`errored`状態
- 再起動回数が異常に多い（例: 2776回）

**確認方法**:
```bash
ssh yaku-navi
cd /var/www/pharmacy-platform
pm2 status
```

**期待される出力（正常）**:
```
│ 0  │ pharmacy-backend     │ online    │ 0回再起動 │
│ 1  │ pharmacy-frontend    │ online    │ 0回再起動 │
```

**異常な出力の例**:
```
│ 0  │ pharmacy-backend     │ stopped   │ 2776回再起動 │ ← 異常
│ 1  │ pharmacy-frontend    │ online    │ 0回再起動 │
```

---

#### 2. データベース接続エラーによるクラッシュ

**症状**:
- バックエンドが起動直後にクラッシュ
- ログにデータベース認証エラーが大量に記録される

**エラーログの例**:
```
Database connection failed: error: password authentication failed for user "pharmacy_user"
❌ Prisma Client initialization failed: PrismaClientInitializationError
```

**原因**:
- データベースユーザー名と環境変数の不一致
- パスワードが設定されていない、または間違っている
- データベース接続URLの設定ミス

**確認方法**:
```bash
# エラーログを確認
pm2 logs pharmacy-backend --err --lines 50

# ログをファイルに保存して確認
pm2 logs pharmacy-backend --err --lines 1000 > backend-error.log 2>&1
# Ctrl+Cで停止後、ファイルを確認
cat backend-error.log | head -n 100
```

---

#### 3. メモリ不足による強制終了（OOM Killer）

**症状**:
- プロセスが突然停止
- システムログにOOM Killerの記録がある

**確認方法**:
```bash
# メモリ使用状況を確認
free -h

# OOM Killerの記録を確認
dmesg | grep -i "out of memory" | tail -20
journalctl -k | grep -i "out of memory" | tail -20

# PM2のメモリ使用状況を確認
pm2 monit
```

**対策**:
- `ecosystem.config.js`で`max_memory_restart`を設定
- メモリ制限を適切に調整

---

#### 4. サーバー再起動による停止

**症状**:
- サーバー再起動後にPM2プロセスが起動しない
- `uptime`で稼働時間が短い

**確認方法**:
```bash
# サーバーの稼働時間を確認
uptime

# 再起動履歴を確認
last reboot | head -10

# systemdの起動履歴を確認
journalctl --list-boots | head -10
```

**判定**:
- 稼働時間が短い（数日以内）→ サーバーが頻繁に再起動している
- 稼働時間が長い（1週間以上）→ PM2デーモンがクラッシュしている

**対策**:
- PM2自動起動設定を実施（`pm2 startup systemd`）
- `pm2 save`でプロセスリストを保存

---

#### 5. PM2デーモンのクラッシュ

**症状**:
- PM2自体が停止している
- `pm2 status`が応答しない、またはエラーを返す

**確認方法**:
```bash
# PM2デーモンの状態を確認
pm2 ping

# systemdサービスの状態を確認
systemctl status pm2-root

# PM2のログを確認
pm2 logs --lines 200
```

---

### 502エラーの分析方法

#### Step 1: PM2ステータスの確認

```bash
ssh yaku-navi
cd /var/www/pharmacy-platform

# PM2プロセスの状態を確認
pm2 status

# 詳細情報を確認
pm2 info pharmacy-backend
pm2 info pharmacy-frontend
```

**確認ポイント**:
- ステータスが`online`か？
- 再起動回数が異常に多くないか？（0-1回が正常）
- メモリ使用量が適切か？

---

#### Step 2: ログの確認

```bash
# バックエンドのエラーログを確認
pm2 logs pharmacy-backend --err --lines 50

# フロントエンドのエラーログを確認
pm2 logs pharmacy-frontend --err --lines 50

# すべてのログを確認
pm2 logs --lines 100
```

**ログをファイルに保存する場合**:
```bash
# エラーログをファイルに保存（Ctrl+Cで停止可能）
pm2 logs pharmacy-backend --err --lines 1000 > backend-error-snapshot.log 2>&1

# 数秒待ってから Ctrl+C で停止

# 保存したファイルを確認
cat backend-error-snapshot.log | head -n 100
```

**よくあるエラーパターン**:
- `password authentication failed` → データベース認証エラー
- `Cannot find module` → 依存関係の問題
- `EADDRINUSE` → ポートが既に使用されている
- `ECONNREFUSED` → データベース接続エラー

---

#### Step 3: システムリソースの確認

```bash
# メモリ使用状況
free -h

# ディスク使用状況
df -h

# CPU使用状況
top -bn1 | head -20

# ポートの使用状況
netstat -tulpn | grep -E '3000|3001'
```

**判定基準**:
- メモリ使用率が90%以上 → メモリ不足の可能性
- ディスク使用率が90%以上 → ディスク容量不足
- ポートが使用されていない → プロセスが停止している

---

#### Step 4: データベース接続の確認

```bash
# データベースユーザーを確認
sudo -u postgres psql -c "\du"

# 環境変数を確認
cd /var/www/pharmacy-platform/backend
cat .env | grep DATABASE_URL

# データベース接続をテスト
PGPASSWORD=your_password psql -U pharmacy_user -h localhost -d pharmacy_platform -c "SELECT 1;"
```

---

#### Step 5: Nginxのログを確認

```bash
# Nginxのエラーログを確認
tail -f /var/log/nginx/error.log

# 最新のエラーログを確認
tail -n 50 /var/log/nginx/error.log | grep -i "502\|bad gateway"
```

---

### 実際に発生した問題の分析結果

#### 問題1: データベース認証エラー（2026年1月26日発生）

**症状**:
- バックエンドが**2776回**も再起動を繰り返していた
- PM2ステータスで`↺ 2776`と表示
- ログに`password authentication failed for user "pharmacy_user"`が大量に記録
- 502エラーが継続的に発生

**原因の特定プロセス**:

1. **PM2ステータスの確認**
   ```bash
   pm2 status
   # 結果: pharmacy-backend が 2776回再起動
   ```

2. **ログの確認**
   ```bash
   # ログが大量に出力され、ターミナルから溢れる状況
   pm2 logs pharmacy-backend --err --lines 1000
   
   # ログをファイルに保存して確認
   pm2 logs pharmacy-backend --err --lines 1000 > backend-error-snapshot.log 2>&1
   # Ctrl+Cで停止後、ファイルを確認
   ```

3. **ログファイルの分析**
   - ファイルサイズ: 907KB
   - 主なエラー: `password authentication failed for user "pharmacy_user"`
   - エラーコード: `28P01` (PostgreSQL認証エラー)

4. **環境変数の確認**
   ```bash
   cat /var/www/pharmacy-platform/backend/.env | grep DATABASE_URL
   # 結果: DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public"
   ```

5. **データベースユーザーの確認**
   ```bash
   sudo -u postgres psql -c "\du"
   # 結果: pharmacy_user は存在するが、soedakei は存在しない
   ```

**根本原因**:
- 環境変数`DATABASE_URL`で`soedakei`ユーザーを指定していたが、実際のデータベースには`pharmacy_user`しか存在しなかった
- `pharmacy_user`にパスワードが設定されていなかった（Peer認証のみ）
- アプリケーションは`pharmacy_user`で接続しようとしていたが、環境変数は`soedakei`を指定していた

**解決手順**:

1. **データベースユーザーにパスワードを設定**
   ```bash
   sudo -u postgres psql -c "ALTER USER pharmacy_user WITH PASSWORD 'pharmacy_platform_2024';"
   ```

2. **環境変数を修正**
   ```bash
   cd /var/www/pharmacy-platform/backend
   nano .env
   ```
   
   **修正前**:
   ```env
   DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public"
   ```
   
   **修正後**:
   ```env
   DATABASE_URL="postgresql://pharmacy_user:pharmacy_platform_2024@localhost:5432/pharmacy_platform?schema=public"
   ```

3. **データベース接続をテスト**
   ```bash
   PGPASSWORD=pharmacy_platform_2024 psql -U pharmacy_user -h localhost -d pharmacy_platform -c "SELECT 1;"
   # 結果: 接続成功
   ```

4. **PM2プロセスを再起動**
   ```bash
   pm2 restart pharmacy-backend
   pm2 logs pharmacy-backend --lines 20
   # 結果: 正常に起動、再起動回数が0回に
   ```

**解決後の状態**:
- バックエンドの再起動回数: 2776回 → 0回
- データベース接続: 成功
- PM2プロセス: `online`状態で安定稼働

---

#### 問題2: ビルド時のdevDependencies不足

**症状**:
- フロントエンドのビルドが失敗
- `Error: Cannot find module '@tailwindcss/postcss'`

**原因**:
- `npm install --production`を実行したため、`devDependencies`がインストールされなかった
- Next.jsのビルドには`@tailwindcss/postcss`などの`devDependencies`が必要

**解決方法**:
```bash
cd /var/www/pharmacy-platform
npm install  # --productionフラグを付けない
npm run build
```

---

### 502エラー分析のチェックリスト

502エラーが発生した場合、以下の順序で確認してください：

- [ ] **PM2ステータスの確認**
  ```bash
  pm2 status
  ```

- [ ] **ログの確認**
  ```bash
  pm2 logs pharmacy-backend --err --lines 50
  pm2 logs pharmacy-frontend --err --lines 50
  ```

- [ ] **システムリソースの確認**
  ```bash
  free -h
  df -h
  ```

- [ ] **データベース接続の確認**
  ```bash
  cd /var/www/pharmacy-platform/backend
  cat .env | grep DATABASE_URL
  ```

- [ ] **ポートの使用状況確認**
  ```bash
  netstat -tulpn | grep -E '3000|3001'
  ```

- [ ] **Nginxのログ確認**
  ```bash
  tail -n 50 /var/log/nginx/error.log
  ```

---

### 502エラーの予防策

#### 1. PM2自動起動設定（必須）

```bash
pm2 startup systemd -u root --hp /root
pm2 save
```

**効果**: サーバー再起動後も自動でプロセスが起動

---

#### 2. PM2自動再起動設定の強化

`ecosystem.config.js`で以下の設定を実施：

```javascript
{
  autorestart: true,
  max_restarts: 15,
  restart_delay: 5000,
  max_memory_restart: "500M",  // バックエンド
  max_memory_restart: "1G",    // フロントエンド
  cron_restart: "0 4 * * *",   // 毎日午前4時に再起動
}
```

**効果**: プロセスがクラッシュしても自動再起動

---

#### 3. データベース接続の確認

定期的にデータベース接続をテスト：

```bash
# データベース接続テスト
PGPASSWORD=your_password psql -U pharmacy_user -h localhost -d pharmacy_platform -c "SELECT 1;"
```

**効果**: データベース接続エラーを早期発見

---

#### 4. ログの定期確認

```bash
# エラーログを定期的に確認
pm2 logs pharmacy-backend --err --lines 20 --nostream
```

**効果**: 問題を早期発見

---

#### 5. 監視ツールの導入（推奨）

- **Uptime Robot**: 無料で5分間隔の監視
- **PM2 Plus**: PM2の監視機能（有料）
- **自前の監視スクリプト**: cronで定期実行

---

## 🔧 事前準備

### 1. SSH設定ファイルの確認

SSH鍵認証でパスワード入力を回避するため、SSH設定ファイルを確認：

```bash
# SSH設定ファイルを確認
cat ~/.ssh/config | grep -A 5 "yaku-navi"
```

**設定例**:
```
Host yaku-navi
    HostName 162.43.8.168
    User root
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    StrictHostKeyChecking no
```

### 2. 必要なファイルの確認

ローカルで以下のファイルが存在することを確認：

```bash
cd /Users/soedakei/pharmacy-platform

# 必須ファイルの確認
ls -la ecosystem.config.js
ls -la package.json
ls -la backend/package.json
ls -la upload-to-yaku-navi.sh
```

---

## 📤 ファイルアップロード

### 方法A: 自動アップロードスクリプトを使用（推奨）

```bash
cd /Users/soedakei/pharmacy-platform

# アップロードスクリプトに実行権限を付与（初回のみ）
chmod +x upload-to-yaku-navi.sh

# アップロード実行
./upload-to-yaku-navi.sh
```

**アップロードされる内容**:
- `backend/` ディレクトリ（`node_modules`を除く）
- `app/` ディレクトリ
- `components/` ディレクトリ
- `lib/` ディレクトリ
- `public/` ディレクトリ
- 設定ファイル（`package.json`, `next.config.ts`, `tsconfig.json`, `ecosystem.config.js`など）

**注意**: `tailwind.config.ts`が存在しない場合は警告が表示されますが、問題ありません。

### 方法B: 手動アップロード

```bash
# バックエンドをアップロード
rsync -avz --exclude 'node_modules' --exclude '.git' \
  backend/ yaku-navi:/var/www/pharmacy-platform/backend/

# フロントエンドファイルをアップロード
rsync -avz --exclude 'node_modules' --exclude '.git' \
  app/ yaku-navi:/var/www/pharmacy-platform/app/

# 設定ファイルをアップロード
scp ecosystem.config.js yaku-navi:/var/www/pharmacy-platform/
scp package.json yaku-navi:/var/www/pharmacy-platform/
scp next.config.ts yaku-navi:/var/www/pharmacy-platform/
```

---

## 📦 依存関係のインストールとビルド

### Step 1: SSH接続

```bash
ssh yaku-navi
```

### Step 2: プロジェクトディレクトリに移動

```bash
cd /var/www/pharmacy-platform
```

### Step 3: 古いビルドをクリーンアップ（推奨）

```bash
# 古い.nextディレクトリを削除
rm -rf .next
```

### Step 4: バックエンドの依存関係をインストール

```bash
cd /var/www/pharmacy-platform/backend
npm install --production
```

### Step 5: フロントエンドの依存関係をインストール

**重要**: ビルドには`devDependencies`が必要なため、`--production`フラグは使用しません。

```bash
cd /var/www/pharmacy-platform
npm install
```

**理由**: Next.jsのビルドには`@tailwindcss/postcss`などの`devDependencies`が必要です。

### Step 6: フロントエンドをビルド

```bash
cd /var/www/pharmacy-platform
npm run build
```

**ビルド時間**: 5-10分程度かかる場合があります。

**期待される出力**:
```
✓ Compiled successfully
✓ Linting and checking validity of types 
✓ Collecting page data    
✓ Generating static pages (16/16)
```

---

## 🗄️ データベース接続の修正

### Step 1: データベースユーザーを確認

```bash
# PostgreSQLに接続してユーザー一覧を確認
sudo -u postgres psql -c "\du"
```

**確認項目**:
- `pharmacy_user`が存在するか
- `soedakei`が存在するか

### Step 2: データベースユーザーにパスワードを設定

```bash
# pharmacy_userにパスワードを設定
sudo -u postgres psql -c "ALTER USER pharmacy_user WITH PASSWORD 'pharmacy_platform_2024';"
```

### Step 3: 環境変数を修正

```bash
cd /var/www/pharmacy-platform/backend
nano .env
```

**修正内容**:
```env
# 修正前
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public"

# 修正後
DATABASE_URL="postgresql://pharmacy_user:pharmacy_platform_2024@localhost:5432/pharmacy_platform?schema=public"
```

保存: `Ctrl + X` → `Y` → `Enter`

### Step 4: データベース接続をテスト

```bash
# パスワード認証で接続テスト
PGPASSWORD=pharmacy_platform_2024 psql -U pharmacy_user -h localhost -d pharmacy_platform -c "SELECT 1;"
```

**期待される出力**: `?column?` に `1` が表示されれば成功

---

## 🔄 PM2プロセスの再起動

### Step 1: 現在のPM2プロセスを確認

```bash
cd /var/www/pharmacy-platform
pm2 status
```

### Step 2: 既存プロセスをリセット

```bash
# 全プロセスを停止
pm2 stop all

# 全プロセスを削除
pm2 delete all

# PM2プロセスリストをクリア
pm2 flush

# 確認（空のリストが表示されればOK）
pm2 list
```

### Step 3: 新しい設定で起動

```bash
cd /var/www/pharmacy-platform

# ecosystem.config.jsで起動
pm2 start ecosystem.config.js

# ステータス確認
pm2 status
```

**期待される出力**:
```
│ 0  │ pharmacy-backend     │ online    │ 0回再起動 │
│ 1  │ pharmacy-frontend    │ online    │ 0回再起動 │
```

### Step 4: ログを確認

```bash
# バックエンドログを確認
pm2 logs pharmacy-backend --lines 30 --nostream

# フロントエンドログを確認
pm2 logs pharmacy-frontend --lines 30 --nostream
```

**正常なログの例**:
```
✅ Prisma Client initialized successfully
Database connected successfully
Server running on port 3001
```

---

## ⚙️ PM2自動起動設定

### Step 1: systemdサービスの作成

```bash
cd /var/www/pharmacy-platform

# PM2の自動起動設定を生成
pm2 startup systemd -u root --hp /root
```

**出力例**:
```
[PM2] Writing init configuration in /etc/systemd/system/pm2-root.service
[PM2] Making script booting at startup...
[PM2] [v] Command successfully executed.
```

### Step 2: PM2プロセスリストを保存

```bash
# 現在のプロセスリストを保存
pm2 save
```

**出力例**:
```
[PM2] Saving current process list...
[PM2] Successfully saved in /root/.pm2/dump.pm2
```

### Step 3: systemdサービスの状態を確認

```bash
# 自動起動が有効か確認
systemctl is-enabled pm2-root

# サービス状態を確認
systemctl status pm2-root
```

**期待される出力**:
```
enabled  ← 自動起動が有効
Active: active (running)  ← サービスが実行中
```

### Step 4: 自動起動設定の確認

```bash
# systemdサービスファイルの内容を確認
cat /etc/systemd/system/pm2-root.service

# PM2プロセスリストの保存状態を確認
ls -lh /root/.pm2/dump.pm2
```

---

## ✅ 動作確認

### Step 1: ローカルホストでの確認

```bash
# バックエンドのヘルスチェック
curl http://localhost:3001/health

# フロントエンドの確認
curl http://localhost:3000 | head -n 5
```

**期待される出力**:
- バックエンド: `{"status":"healthy",...}`
- フロントエンド: HTMLが返ってくる

### Step 2: ドメインでの確認

```bash
# HTTPSでのアクセステスト
curl -s -o /dev/null -w 'Status: %{http_code}\n' https://yaku-navi.com

# APIの確認
curl -s https://yaku-navi.com/api/health
```

**期待される出力**:
- HTTPS: `Status: 200`
- API: `{"status":"healthy",...}`

### Step 3: PM2プロセスの状態確認

```bash
pm2 status
```

**期待される状態**:
- 両プロセスが`online`
- 再起動回数が少ない（0-1回程度）

---

## 🔍 トラブルシューティング

### 問題1: ビルドエラー「Cannot find module '@tailwindcss/postcss'」

**原因**: `devDependencies`がインストールされていない

**解決方法**:
```bash
cd /var/www/pharmacy-platform
npm install  # --productionフラグを付けない
npm run build
```

### 問題2: データベース接続エラー「password authentication failed」

**原因**: データベースユーザー名またはパスワードが間違っている

**解決方法**:
```bash
# 1. データベースユーザーを確認
sudo -u postgres psql -c "\du"

# 2. パスワードを設定
sudo -u postgres psql -c "ALTER USER pharmacy_user WITH PASSWORD 'your_password';"

# 3. 環境変数を修正
cd /var/www/pharmacy-platform/backend
nano .env
# DATABASE_URLを修正

# 4. PM2プロセスを再起動
pm2 restart pharmacy-backend
```

### 問題3: PM2プロセスが起動しない

**原因**: ポートが既に使用されている、または環境変数の問題

**解決方法**:
```bash
# 1. ポートの使用状況を確認
netstat -tulpn | grep -E '3000|3001'

# 2. ログを確認
pm2 logs pharmacy-backend --lines 50 --err

# 3. 環境変数を確認
cd /var/www/pharmacy-platform/backend
cat .env
```

### 問題4: サーバー再起動後にPM2プロセスが起動しない

**原因**: systemdサービスの設定が不完全

**解決方法**:
```bash
# 1. systemdサービスの状態を確認
systemctl status pm2-root

# 2. サービスを有効化
systemctl enable pm2-root

# 3. PM2プロセスリストを再保存
pm2 save

# 4. サービスを再起動
systemctl restart pm2-root
```

---

## 📝 PM2自動起動設定の詳細

### systemdサービスファイル

**ファイルパス**: `/etc/systemd/system/pm2-root.service`

```ini
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=root
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=PM2_HOME=/root/.pm2
PIDFile=/root/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/usr/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/usr/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target
```

### PM2プロセスリスト

**ファイルパス**: `/root/.pm2/dump.pm2`

このファイルに現在のPM2プロセス状態が保存されています。`pm2 save`で更新できます。

### 自動起動の動作フロー

1. **サーバー起動時**: systemdが`pm2-root.service`を自動起動
2. **プロセス復元**: `pm2 resurrect`が実行される
3. **プロセス起動**: `/root/.pm2/dump.pm2`からプロセスリストを読み込み、自動起動

---

## 🔧 よく使うコマンド

### PM2プロセスの管理

```bash
# ステータス確認
pm2 status

# プロセスを再起動
pm2 restart pharmacy-backend
pm2 restart pharmacy-frontend
pm2 restart all

# プロセスを停止
pm2 stop pharmacy-backend
pm2 stop all

# ログを確認
pm2 logs pharmacy-backend --lines 50
pm2 logs pharmacy-frontend --lines 50

# プロセスリストを保存
pm2 save
```

### systemdサービスの管理

```bash
# サービス状態を確認
systemctl status pm2-root

# サービスを再起動
systemctl restart pm2-root

# 自動起動を有効化
systemctl enable pm2-root

# 自動起動を無効化
systemctl disable pm2-root
```

### ログの確認

```bash
# PM2ログを確認
pm2 logs pharmacy-backend --lines 100 --nostream

# systemdサービスのログを確認
journalctl -u pm2-root -n 50

# Nginxのログを確認
tail -f /var/log/nginx/error.log
```

---

## 📊 確認チェックリスト

再デプロイ完了後、以下の項目を確認してください：

- [ ] ファイルアップロードが完了している
- [ ] 依存関係のインストールが完了している
- [ ] フロントエンドのビルドが成功している
- [ ] データベース接続が正常である
- [ ] PM2プロセスが両方とも`online`である
- [ ] ローカルホストでのアクセスが正常である
- [ ] ドメイン（https://yaku-navi.com）でのアクセスが正常である
- [ ] API（https://yaku-navi.com/api/health）が正常に応答する
- [ ] systemdサービスが`enabled`である
- [ ] PM2プロセスリストが保存されている

---

## 🎯 まとめ

### 完了した作業

1. ✅ プロジェクトファイルのアップロード
2. ✅ 依存関係のインストール（devDependencies含む）
3. ✅ フロントエンドのビルド
4. ✅ データベース接続の修正
5. ✅ PM2プロセスの再起動
6. ✅ PM2自動起動設定（systemd）
7. ✅ ドメインでのアクセステスト

### 現在の状態

- **フロントエンド**: `https://yaku-navi.com` → 正常動作
- **バックエンドAPI**: `https://yaku-navi.com/api/health` → 正常動作
- **PM2プロセス**: 両方とも`online`、再起動回数0-1回
- **自動起動**: systemdサービスが`enabled`、サーバー再起動時に自動復元

### 次のステップ

- 定期的な動作確認（週1回程度）
- ログの定期確認（エラーの早期発見）
- セキュリティアップデートの実施

---

---

## 📊 502エラー発生時の緊急対応フロー

### 即座に実施すべき手順

#### Step 1: 状況確認（2分）

```bash
# SSH接続
ssh yaku-navi

# PM2ステータス確認
cd /var/www/pharmacy-platform
pm2 status

# ログをファイルに保存（大量のログが流れる場合）
pm2 logs pharmacy-backend --err --lines 1000 > error-snapshot.log 2>&1
# 数秒待ってから Ctrl+C で停止
```

#### Step 2: 原因の特定（5分）

```bash
# ログファイルを確認
cat error-snapshot.log | head -n 50

# データベース接続を確認
cd /var/www/pharmacy-platform/backend
cat .env | grep DATABASE_URL

# システムリソースを確認
free -h
df -h
```

#### Step 3: 応急処置（3分）

**データベース接続エラーの場合**:
```bash
# データベース接続を修正（上記の手順を参照）
# PM2プロセスを再起動
pm2 restart pharmacy-backend
```

**プロセスが停止している場合**:
```bash
# PM2プロセスを再起動
pm2 restart all
```

#### Step 4: 動作確認（2分）

```bash
# PM2ステータス確認
pm2 status

# ヘルスチェック
curl http://localhost:3001/health
curl http://localhost:3000

# ドメインでの確認
curl -s -o /dev/null -w 'Status: %{http_code}\n' https://yaku-navi.com
```

---

## 📝 まとめ

### 502エラーの主な要因

1. **データベース認証エラー**（最も一般的）
   - 環境変数とデータベースユーザーの不一致
   - パスワード未設定

2. **PM2プロセスの停止**
   - サーバー再起動による停止
   - メモリ不足によるクラッシュ

3. **依存関係の問題**
   - `devDependencies`の不足
   - ビルドエラー

4. **システムリソース不足**
   - メモリ不足
   - ディスク容量不足

### 分析のポイント

- **PM2ステータス**: 再起動回数が異常に多い場合は要注意
- **ログファイル**: エラーログをファイルに保存して分析
- **データベース接続**: 環境変数と実際のユーザーを確認
- **システムリソース**: メモリ・ディスク使用率を確認

### 予防策

1. ✅ PM2自動起動設定（必須）
2. ✅ PM2自動再起動設定の強化
3. ✅ データベース接続の定期確認
4. ✅ ログの定期確認
5. ✅ 監視ツールの導入（推奨）

---

**最終更新**: 2026年1月26日  
**作成者**: Auto (Cursor AI Assistant)

