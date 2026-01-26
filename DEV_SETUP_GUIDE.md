# 🚀 開発環境セットアップガイド

## ポート設定

別サイト（http://localhost:3000）との競合を避けるため、以下のポートを使用します：

- **フロントエンド**: ポート **3005**
- **バックエンド**: ポート **3001**（既存設定）

---

## 🎯 クイックスタート

### 1. 起動スクリプトに実行権限を付与

```bash
chmod +x start-dev.sh stop-dev.sh
```

### 2. 開発サーバーを起動

```bash
./start-dev.sh
```

### 3. ブラウザでアクセス

起動後、以下のURLにアクセスできます：

#### メインページ
- **トップページ**: http://localhost:3005/
- **ログイン**: http://localhost:3005/auth/login

#### ダッシュボード
- **薬局ダッシュボード**: http://localhost:3005/pharmacy/dashboard
- **薬剤師ダッシュボード**: http://localhost:3005/pharmacist/dashboard

#### プレビューページ
- **請求書プレビュー**: http://localhost:3005/preview/invoice
- **労働条件通知書プレビュー**: http://localhost:3005/preview/work-notice

#### バックエンドAPI
- **API エンドポイント**: http://localhost:3001/api

### 4. 停止

```bash
./stop-dev.sh
```

---

## 📝 手動起動の場合

### フロントエンド（ポート3005）

```bash
npm run dev
```

または

```bash
next dev --turbopack -p 3005
```

### バックエンド（ポート3001）

```bash
cd backend
npm run dev
```

---

## 🔧 環境変数の設定

### フロントエンド（.env.local）

プロジェクトルートに`.env.local`ファイルを作成：

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# その他の環境変数
# NEXT_PUBLIC_SITE_URL=http://localhost:3005
```

### バックエンド（backend/.env）

`backend/.env`ファイルを確認・作成：

```env
# サーバーポート
PORT=3001

# データベース接続
DATABASE_URL=postgresql://user:password@localhost:5432/pharmacy_platform

# JWT秘密鍵
JWT_SECRET=your-secret-key

# その他の設定
NODE_ENV=development
```

---

## 🎨 起動スクリプトの機能

### start-dev.sh の特徴

1. **ポート使用状況の自動チェック**
   - ポート3001, 3005が使用中かを確認
   - 競合がある場合は既存プロセスを停止

2. **依存関係の自動確認**
   - node_modulesが存在しない場合、自動でnpm install

3. **バックグラウンド起動**
   - フロントエンド・バックエンドをバックグラウンドで起動
   - ログはfrontend.log, backend.logに出力

4. **起動確認**
   - サーバーが起動するまで待機
   - アクセスURLを一覧表示

### stop-dev.sh の特徴

1. **安全な停止**
   - ポート3001, 3005で起動中のプロセスを停止

2. **ログファイル管理**
   - 停止時にログファイルを削除するか選択可能

---

## 📊 ログの確認

### リアルタイムでログを表示

```bash
# フロントエンドのログ
tail -f frontend.log

# バックエンドのログ
tail -f backend.log

# 両方同時に表示
tail -f frontend.log backend.log
```

### ログファイルの場所

- `frontend.log` - Next.jsの出力
- `backend.log` - Expressの出力

---

## ⚠️ トラブルシューティング

### ポート3005が既に使用されている

```bash
# 使用中のプロセスを確認
lsof -i :3005

# プロセスを強制終了
lsof -ti:3005 | xargs kill -9
```

### ポート3001が既に使用されている

```bash
# 使用中のプロセスを確認
lsof -i :3001

# プロセスを強制終了
lsof -ti:3001 | xargs kill -9
```

### データベース接続エラー

```bash
# PostgreSQLが起動しているか確認
psql -U your_user -d pharmacy_platform -c "SELECT 1;"

# PostgreSQLを起動
brew services start postgresql@14  # Homebrewの場合
```

### node_modulesの再インストール

```bash
# フロントエンド
rm -rf node_modules package-lock.json
npm install

# バックエンド
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 🔄 ポート変更が必要な場合

### フロントエンドのポートを変更

1. **package.json を編集**:

```json
"scripts": {
  "dev": "next dev --turbopack -p 3005",  // ← ポート番号を変更
  "start": "next start -p 3005"           // ← ポート番号を変更
}
```

2. **start-dev.sh を編集**:

```bash
# ポート3005のチェック部分を変更
if lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null ; then
```

3. **stop-dev.sh を編集**:

```bash
# ポート3005の停止部分を変更
if lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null ; then
```

### バックエンドのポートを変更

1. **backend/.env を編集**:

```env
PORT=3001  // ← ポート番号を変更
```

2. **start-dev.sh を編集**:

```bash
# ポート3001のチェック部分を変更
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
```

---

## 📦 本番環境へのデプロイ

### ビルド

```bash
# フロントエンド
npm run build

# バックエンド（特別なビルドは不要）
cd backend
npm install --production
```

### 起動

```bash
# フロントエンド
npm start

# バックエンド
cd backend
npm start
```

---

## 🎯 テストアカウント

開発環境で使用できるテストアカウント：

### 薬局アカウント
- **メール**: test-pharmacy@example.com
- **パスワード**: test1234

### 薬剤師アカウント
- **メール**: test-pharmacist@example.com
- **パスワード**: test1234

---

## 💡 開発時のヒント

### Hot Reload

Next.jsのTurbopackモードが有効なため、コード変更時に自動でリロードされます。

### API呼び出しの確認

ブラウザのDevToolsで以下を確認：
- **Network タブ**: API呼び出しを確認
- **Console タブ**: エラーメッセージを確認

### データベースの確認

```bash
# psqlで接続
psql -U your_user -d pharmacy_platform

# テーブル一覧
\dt

# データ確認
SELECT * FROM users LIMIT 10;
```

---

## 📞 サポート

### よくある質問

1. **ポート3000と競合する？**
   → いいえ、ポート3005を使用するため競合しません。

2. **同時に複数のプロジェクトを起動できる？**
   → はい、ポートが異なれば複数起動可能です。

3. **停止を忘れたら？**
   → ./stop-dev.sh を実行するか、マシンを再起動してください。

### エラーが解決しない場合

1. ログファイルを確認
2. ポート使用状況を確認
3. データベース接続を確認
4. node_modulesを再インストール

---

**作成日**: 2026年1月25日  
**最終更新**: 2026年1月25日

