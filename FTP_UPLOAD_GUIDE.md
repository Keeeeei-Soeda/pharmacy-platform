# FTP/SFTP アップロード手順（簡易版）

## 🎯 この方法が向いているケース

- コマンドライン操作に不慣れな方
- 視覚的にファイルを管理したい方
- 初回デプロイまたは大規模な更新時

---

## 📦 必要なツール

### FileZilla（無料・推奨）
- ダウンロード: https://filezilla-project.org/
- Windows / Mac / Linux 対応

### または WinSCP（Windows専用）
- ダウンロード: https://winscp.net/

---

## 🔐 接続設定（FileZilla）

### Step 1: FileZillaを開く

1. **サイトマネージャー**を開く（ファイル → サイトマネージャー）
2. **新しいサイト**をクリック
3. 名前を入力（例：`Xserver VPS - Pharmacy`）

### Step 2: 接続情報を入力

```
プロトコル: SFTP - SSH File Transfer Protocol
ホスト: あなたのサーバーIP（例：123.456.789.012）
ポート: 22（またはXserverで設定したSSHポート）
ログオンタイプ: 通常
ユーザー: pharmacy（または作成したユーザー名）
パスワード: 設定したパスワード
```

### Step 3: 接続

1. **接続**ボタンをクリック
2. 初回接続時に「不明なホストキー」の警告が出たら**OK**をクリック
3. 接続成功すると、右側にサーバーのファイル一覧が表示されます

---

## 📁 アップロードするファイル

### ローカル側（左側）

プロジェクトフォルダ：
```
/Users/soedakei/pharmacy-platform/
```

### サーバー側（右側）

アップロード先：
```
/home/pharmacy/pharmacy-platform/
```

---

## ⚠️ アップロード前の準備

### 1. ローカルで不要なファイルを除外

以下のフォルダ・ファイルは**アップロード不要**です：

```
❌ node_modules/（両方）
❌ .next/（フロントエンド）
❌ backend/node_modules/
❌ .git/
❌ .env（ローカル用）
❌ .env.local（ローカル用）
❌ backend/.env（ローカル用）
❌ uploads/（ローカルのテストファイル）
```

### 2. アップロードが必要なファイル

```
✅ app/
✅ backend/src/
✅ backend/package.json
✅ backend/package-lock.json
✅ components/
✅ lib/
✅ prisma/
✅ public/
✅ package.json
✅ package-lock.json
✅ next.config.ts
✅ tailwind.config.ts
✅ tsconfig.json
✅ その他設定ファイル
```

---

## 📤 アップロード手順

### Step 1: サーバー側のディレクトリ作成

1. FileZillaの右側（サーバー側）で **`/home/pharmacy/`** に移動
2. 右クリック → **ディレクトリを作成**
3. 名前: `pharmacy-platform`
4. 作成した `pharmacy-platform` フォルダに移動

### Step 2: ファイルをアップロード

1. FileZillaの左側（ローカル側）で **`/Users/soedakei/pharmacy-platform/`** に移動

2. 以下のフォルダ・ファイルを選択（Ctrl/Cmd + クリックで複数選択）：
   - `app/`
   - `backend/` （※ `node_modules/` を除く）
   - `components/`
   - `lib/`
   - `prisma/`
   - `public/`
   - `package.json`
   - `package-lock.json`
   - `next.config.ts`
   - `tailwind.config.ts`
   - `tsconfig.json`
   - その他必要なファイル

3. 右クリック → **アップロード**

4. アップロード進行状況がウィンドウ下部に表示されます

### Step 3: backend内のファイルも確認

1. `backend/` フォルダ内の `node_modules/` が**アップロードされていないか**確認
2. もしアップロードされていたら削除（サーバー側で再インストールします）

---

## 🔧 アップロード後の作業（SSH接続が必要）

### 重要：FTPだけでは完了しません

アップロード後、**SSH接続して以下を実行**する必要があります：

```bash
# SSH接続
ssh pharmacy@あなたのサーバーIP

# プロジェクトディレクトリに移動
cd ~/pharmacy-platform

# 依存パッケージをインストール
npm install
cd backend
npm install
cd ..

# 環境変数ファイルを作成
nano backend/.env
# （.envの内容を入力 - XSERVER_DEPLOY_GUIDE.md参照）

nano .env.local
# （.env.localの内容を入力 - XSERVER_DEPLOY_GUIDE.md参照）

# Prismaセットアップ
cd backend
npx prisma generate
cd ..

# フロントエンドをビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔄 更新時のアップロード手順

### 小規模な変更（個別ファイルのみ）

1. 変更したファイルのみを選択
2. FileZillaでサーバー側の同じ場所にアップロード
3. SSH接続して該当サービスを再起動：
   ```bash
   pm2 restart pharmacy-backend  # バックエンドのみ
   pm2 restart pharmacy-frontend  # フロントエンドのみ
   ```

### 大規模な変更

1. 全ファイルを再アップロード
2. SSH接続して：
   ```bash
   cd ~/pharmacy-platform
   npm install
   cd backend
   npm install
   cd ..
   npm run build
   pm2 restart all
   ```

---

## ⚡ より効率的な方法（Git推奨）

FTPより**Git経由の方が圧倒的に効率的**です：

### Git を使う利点

- ✅ 変更分のみ転送（高速）
- ✅ バージョン管理が容易
- ✅ 自動化が可能
- ✅ ファイルの欠損が少ない

### Git デプロイ手順（簡単）

```bash
# 初回のみ
ssh pharmacy@サーバーIP
cd ~
git clone https://github.com/Keeeeei-Soeda/pharmacy-platform.git
cd pharmacy-platform
npm install
cd backend
npm install
cd ..

# 更新時（毎回これだけ）
cd ~/pharmacy-platform
git pull origin main
npm install
cd backend
npm install
cd ..
npm run build
pm2 restart all
```

---

## 🐛 トラブルシューティング

### アップロードが途中で止まる

- ネットワーク接続を確認
- FileZillaを再起動
- 転送設定 → 同時転送数を減らす（デフォルト: 2）

### パーミッションエラー

- サーバー側のフォルダ権限を確認：
  ```bash
  chmod -R 755 ~/pharmacy-platform
  ```

### ファイルが見つからない

- `.gitignore` で除外されているファイルは手動でアップロード
- 環境変数ファイル（`.env`）は別途作成が必要

---

## 📊 アップロード時間の目安

| ファイルサイズ | 通常回線 | 高速回線 |
|--------------|---------|---------|
| 100MB 未満   | 5-10分  | 2-5分   |
| 100-500MB    | 15-30分 | 5-15分  |
| 500MB 以上   | 30分以上| 15分以上|

※ `node_modules/` を除いた場合

---

## 🔐 セキュリティ注意事項

1. **環境変数は絶対にアップロードしない**
   - `.env`
   - `.env.local`
   - `backend/.env`

2. **SFTP（SSH）を使用する**
   - 通常のFTPは暗号化されていない
   - FileZillaでは「SFTP」を選択

3. **接続情報を保存する場合**
   - FileZillaのマスターパスワードを設定
   - 編集 → 設定 → セキュリティ → マスターパスワード

---

**作成日**: 2025-12-13  
**推奨**: できる限り Git デプロイを使用してください

