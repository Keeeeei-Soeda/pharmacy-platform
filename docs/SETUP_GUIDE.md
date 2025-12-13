# セットアップガイド - 薬剤師マッチングプラットフォーム

> 最終更新日: 2025 年 11 月 26 日

---

## 📋 目次

1. [環境変数の設定](#環境変数の設定)
2. [データベースのセットアップ](#データベースのセットアップ)
3. [依存関係のインストール](#依存関係のインストール)
4. [サーバーの起動](#サーバーの起動)
5. [トラブルシューティング](#トラブルシューティング)

---

## 環境変数の設定

### ⚠️ 重要

環境変数ファイルは Git で管理されていません。セキュリティのため、以下の手順で手動作成してください。

---

### 1. フロントエンド環境変数

**ファイル:** `.env.local`（プロジェクトルート）

```bash
# プロジェクトルートで作成
touch .env.local
```

**内容:**

```env
# フロントエンド環境変数
# Next.js (App Router)

# バックエンドAPIのURL
NEXT_PUBLIC_API_URL=http://localhost:3001

# 開発環境フラグ
NODE_ENV=development
```

**作成コマンド:**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
EOF
```

---

### 2. バックエンド環境変数

**ファイル:** `backend/.env`

```bash
# backend/ ディレクトリで作成
cd backend
touch .env
```

**内容:**

```env
# バックエンド環境変数
# Express.js + Prisma

# 環境設定
NODE_ENV=development
PORT=3001

# フロントエンドURL（CORS設定用）
FRONTEND_URL=http://localhost:3000

# データベース接続URL
#
# オプション1: Prisma Accelerate を使用する場合
# DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
#
# オプション2: ローカルPostgreSQLを使用する場合
# DATABASE_URL="postgresql://username:password@localhost:5432/pharmacy_db"
#
# ⚠️ 現在の設定に合わせて変更してください
DATABASE_URL="YOUR_DATABASE_URL_HERE"

# JWT認証シークレット
# ⚠️ 本番環境では必ず強力なランダム文字列に変更してください
# 生成方法: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-very-secure-random-secret-key-change-this-in-production

# メール設定（オプション - 通知機能用）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ファイルアップロード設定
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

**作成コマンド（テンプレート）:**

```bash
cd backend

cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL="YOUR_DATABASE_URL_HERE"
JWT_SECRET=your-very-secure-random-secret-key-change-this-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
EOF
```

**⚠️ 重要な設定:**

1. **DATABASE_URL**: 必ず実際のデータベース URL に変更してください
2. **JWT_SECRET**: セキュアなランダム文字列を生成してください

```bash
# セキュアなJWT_SECRETを生成
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## データベースのセットアップ

### Prisma Accelerate を使用している場合

Prisma Accelerate を使用している場合、マイグレーションは直接実行できません。

**手動での対応:**

1. Prisma Cloud Console で以下の SQL を実行:

```sql
-- 証明書関連フィールドの追加（まだ追加していない場合）
ALTER TABLE pharmacist_profiles
ADD COLUMN IF NOT EXISTS license_file_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS registration_file_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS license_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;
```

2. Prisma Client を生成:

```bash
npx prisma generate
```

---

### ローカル PostgreSQL を使用している場合

**1. PostgreSQL のインストール（まだの場合）:**

```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

# または PostgreSQL.app を使用
# https://postgresapp.com/
```

**2. データベースの作成:**

```bash
# PostgreSQLに接続
psql postgres

# データベースを作成
CREATE DATABASE pharmacy_db;

# ユーザーを作成（オプション）
CREATE USER pharmacy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pharmacy_db TO pharmacy_user;

# 終了
\q
```

**3. DATABASE_URL を設定:**

```env
DATABASE_URL="postgresql://pharmacy_user:your_password@localhost:5432/pharmacy_db"
```

**4. マイグレーションを実行:**

```bash
cd backend
npx prisma migrate dev --name init
```

**5. Prisma Client を生成:**

```bash
npx prisma generate
```

---

## 依存関係のインストール

### 1. フロントエンド

```bash
# プロジェクトルート
npm install
```

**主要な依存関係:**

- Next.js 15.5.4
- React 18.x
- TypeScript 5.x
- Tailwind CSS 3.x
- Axios
- Lucide React
- react-calendar
- browser-image-compression

---

### 2. バックエンド

```bash
cd backend
npm install
```

**主要な依存関係:**

- Express.js 4.x
- Prisma 6.x
- bcrypt
- jsonwebtoken
- multer
- dotenv
- helmet
- cors

---

## サーバーの起動

### 方法 1: 2 つのターミナルを使用

**ターミナル 1 - バックエンド:**

```bash
cd backend
npm start
```

**期待される出力:**

```
🚀 Server running on port 3001
✅ Database connected successfully
```

**ターミナル 2 - フロントエンド:**

```bash
# プロジェクトルート
npm run dev
```

**期待される出力:**

```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

---

### 方法 2: 並行実行（オプション）

**package.json に追加:**

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:backend": "cd backend && npm start",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:backend\""
  }
}
```

**concurrently をインストール:**

```bash
npm install --save-dev concurrently
```

**起動:**

```bash
npm run dev:all
```

---

## 動作確認

### 1. バックエンドの確認

```bash
curl http://localhost:3001/api/auth/me
```

**期待される結果:**

```json
{
  "error": "アクセストークンが必要です"
}
```

→ エラーメッセージが返ってくれば OK（認証が必要なため）

---

### 2. フロントエンドの確認

ブラウザで以下にアクセス:

- http://localhost:3000

**期待される結果:**

- トップページが表示される
- コンソールエラーがない

---

### 3. API 接続の確認

ブラウザの開発者ツール（F12）> Console で実行:

```javascript
fetch("http://localhost:3001/api/auth/me")
  .then((r) => r.json())
  .then(console.log);
```

**期待される結果:**

```javascript
{
  error: "アクセストークンが必要です";
}
```

→ CORS エラーが出ず、レスポンスが返ってくれば OK

---

## トラブルシューティング

### 🔴 エラー: "Cannot find module 'dotenv'"

**原因:** 依存関係がインストールされていない

**解決方法:**

```bash
cd backend
npm install
```

---

### 🔴 エラー: "Port 3001 is already in use"

**原因:** ポート 3001 が既に使用されている

**解決方法 1: プロセスを停止**

```bash
# ポート3001を使用しているプロセスを確認
lsof -ti:3001

# プロセスを停止
lsof -ti:3001 | xargs kill -9
```

**解決方法 2: ポート番号を変更**

```env
# backend/.env
PORT=3002
```

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3002
```

---

### 🔴 エラー: "Can't reach database server"

**原因 1:** DATABASE_URL が正しく設定されていない

**解決方法:**

```bash
# backend/.env を確認
cat backend/.env | grep DATABASE_URL
```

**原因 2:** PostgreSQL が起動していない（ローカル DB の場合）

**解決方法:**

```bash
# macOS (Homebrew)
brew services start postgresql@14

# または PostgreSQL.app を起動
```

**原因 3:** Prisma Client が生成されていない

**解決方法:**

```bash
cd backend
npx prisma generate
```

---

### 🔴 エラー: "Network Error" または CORS エラー

**原因 1:** バックエンドが起動していない

**解決方法:**

```bash
cd backend
npm start
```

**原因 2:** FRONTEND_URL が正しく設定されていない

**解決方法:**

```env
# backend/.env
FRONTEND_URL=http://localhost:3000
```

**原因 3:** バックエンドの CORS 設定を確認

```javascript
// backend/src/app.js
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
```

---

### 🔴 エラー: "JWT must be provided"

**原因:** JWT_SECRET が設定されていない

**解決方法:**

```bash
# セキュアなシークレットを生成
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# backend/.env に追加
JWT_SECRET=生成された文字列
```

---

### 🔴 エラー: ファイルアップロードが失敗する

**原因:** uploads ディレクトリが存在しない

**解決方法:**

```bash
cd backend
mkdir -p uploads/licenses
chmod 755 uploads
chmod 755 uploads/licenses
```

---

## 環境変数チェックリスト

セットアップが完了したら、以下を確認してください:

### フロントエンド (.env.local)

- [ ] `.env.local` ファイルが存在する
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3001` が設定されている
- [ ] `NODE_ENV=development` が設定されている

### バックエンド (backend/.env)

- [ ] `backend/.env` ファイルが存在する
- [ ] `NODE_ENV=development` が設定されている
- [ ] `PORT=3001` が設定されている
- [ ] `FRONTEND_URL=http://localhost:3000` が設定されている
- [ ] `DATABASE_URL` が正しく設定されている
- [ ] `JWT_SECRET` がセキュアな文字列に設定されている
- [ ] アップロードディレクトリが存在する

---

## 環境変数の確認コマンド

```bash
# フロントエンド環境変数を確認
cat .env.local

# バックエンド環境変数を確認（機密情報を除く）
grep -v "SECRET\|PASSWORD\|API_KEY" backend/.env

# または全て表示（セキュリティに注意）
cat backend/.env
```

---

## 次のステップ

環境変数の設定が完了したら:

1. ✅ サーバーを起動
2. ✅ 動作確認
3. ✅ **TEST_PLAN.md** に従ってテスト開始

---

**最終更新:** 2025 年 11 月 26 日  
**バージョン:** 1.0.0
