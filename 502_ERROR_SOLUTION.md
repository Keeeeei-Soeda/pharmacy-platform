# 🚨 502エラー対応ガイド & フロントエンド単独デプロイ方法

**作成日**: 2026年1月25日

---

## 📋 現在の状況

### 問題
- ✅ ローカル開発環境: 正常動作中
- ❌ 本番環境（VPSサーバー）: 502エラー（Bad Gateway）
- ❌ バックエンドサーバーが停止している可能性

### 502エラーの原因
1. PM2プロセスが停止している
2. Nodeプロセスがクラッシュしている
3. メモリ不足でプロセスが強制終了された
4. データベース接続エラー

---

## 🔧 Option 1: VPSサーバーの復旧（推奨）

### 手順

#### 1. サーバーにSSH接続

```bash
ssh ユーザー名@サーバーIP
```

#### 2. PM2のプロセス状況を確認

```bash
pm2 status
```

**確認項目:**
- `backend` と `frontend` のステータスが `online` か？
- `stopped` や `errored` になっていないか？

#### 3. PM2ログを確認してエラーを特定

```bash
# バックエンドのログ
pm2 logs backend --lines 100

# フロントエンドのログ
pm2 logs frontend --lines 100
```

#### 4. プロセスが停止している場合は再起動

```bash
# 全プロセスを再起動
pm2 restart all

# または個別に再起動
pm2 restart backend
pm2 restart frontend
```

#### 5. プロセスが見つからない場合は再デプロイ

```bash
cd /path/to/pharmacy-platform

# バックエンド起動
cd backend
pm2 start npm --name "backend" -- run start

# フロントエンド起動
cd ..
pm2 start npm --name "frontend" -- run start

# プロセスを保存
pm2 save
```

#### 6. 動作確認

```bash
# プロセス確認
pm2 status

# ポート確認
netstat -tuln | grep -E '3000|3001'

# curlで動作確認
curl http://localhost:3001/
curl http://localhost:3000/
```

---

## 🚀 Option 2: フロントエンドのみを暫定デプロイ（静的サイト）

バックエンドが復旧するまで、フロントエンドのみを別のホスティングサービスにデプロイします。

### 🎯 推奨サービス

#### 1. **Vercel** （最も簡単・推奨）
- ✅ Next.jsに最適化
- ✅ GitHubと連携
- ✅ 自動デプロイ
- ✅ 無料プラン

#### 2. **Netlify**
- ✅ 静的サイトホスティング
- ✅ 無料プラン
- ✅ 簡単デプロイ

#### 3. **GitHub Pages**
- ✅ 完全無料
- ✅ 静的ページのみ

---

## 📦 方法A: Vercelにフロントエンドをデプロイ（推奨）

### 準備

#### 1. GitHubリポジトリにプッシュ

```bash
# プロジェクトルートで
git add .
git commit -m "フロントエンドのみデプロイ準備"
git push origin main
```

#### 2. Vercelアカウント作成

https://vercel.com にアクセスして、GitHubアカウントでサインアップ

#### 3. Vercelでプロジェクトをインポート

1. **「New Project」をクリック**
2. **GitHubリポジトリを選択**
3. **プロジェクト設定:**
   - Framework Preset: **Next.js**
   - Root Directory: **/** （プロジェクトルート）
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **環境変数を設定:**
   ```
   NEXT_PUBLIC_API_URL=https://あなたのVPSサーバーのURL
   ```

5. **「Deploy」をクリック**

### デプロイ後

- デプロイが完了すると、Vercelが自動的にURLを発行
- 例: `https://pharmacy-platform-xxx.vercel.app`

---

## 📦 方法B: 請求書ページのみを静的HTMLとしてGitHub Pagesにデプロイ

LPページ（請求書発行画面）だけを暫定的に公開する方法です。

### 手順

#### 1. 静的HTMLエクスポート設定

`next.config.ts` を一時的に変更：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 静的HTMLエクスポート
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

export default nextConfig;
```

#### 2. 静的ファイルをビルド

```bash
npm run build
```

これで `out` フォルダに静的HTMLファイルが生成されます。

#### 3. GitHub Pagesにデプロイ

```bash
# gh-pagesブランチに静的ファイルをデプロイ
npx gh-pages -d out
```

#### 4. GitHub Pagesを有効化

1. GitHubリポジトリの **Settings** > **Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **/ (root)**
4. **Save**

#### 5. アクセス

```
https://あなたのユーザー名.github.io/pharmacy-platform/
```

---

## 📦 方法C: Netlifyにフロントエンドをデプロイ

### 手順

#### 1. Netlifyアカウント作成

https://www.netlify.com にアクセスしてサインアップ

#### 2. 新しいサイトを作成

1. **「Add new site」→「Import an existing project」**
2. **GitHubリポジトリを選択**
3. **ビルド設定:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Framework: **Next.js**

4. **環境変数を設定:**
   ```
   NEXT_PUBLIC_API_URL=https://あなたのVPSサーバーのURL
   ```

5. **「Deploy site」をクリック**

---

## 🎯 暫定対応の推奨フロー

### Step 1: VPSサーバーの状況確認（10分）

```bash
ssh ユーザー名@サーバーIP
pm2 status
pm2 logs backend --lines 50
```

### Step 2: 簡単に復旧できそうなら復旧

```bash
pm2 restart all
```

### Step 3: 復旧が難しい場合はVercelにデプロイ（30分）

1. コードをGitHubにプッシュ
2. Vercelでインポート
3. 環境変数を設定
4. デプロイ

---

## 🚨 緊急対応: 請求書ページのみを即座に公開

### 最速の方法（5分で完了）

#### 1. 請求書ページを単独で抽出

`app/invoice-issued/page.tsx` を単独のHTMLファイルとして保存

#### 2. Netlify Dropでデプロイ

1. https://app.netlify.com/drop にアクセス
2. `out/invoice-issued.html` をドラッグ&ドロップ
3. 即座にURLが発行される

---

## 📊 各方法の比較

| 方法 | 時間 | 難易度 | バックエンド連携 | 推奨度 |
|------|------|--------|-----------------|--------|
| VPS復旧 | 10分 | ⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| Vercel | 30分 | ⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| Netlify | 30分 | ⭐⭐ | ✅ | ⭐⭐⭐ |
| GitHub Pages | 20分 | ⭐⭐⭐ | ❌ | ⭐⭐ |
| Netlify Drop | 5分 | ⭐ | ❌ | ⭐（緊急時のみ）|

---

## 💡 推奨アクション

### 今すぐやるべきこと

1. **VPSサーバーにSSH接続**
   ```bash
   ssh ユーザー名@サーバーIP
   ```

2. **PM2の状態確認**
   ```bash
   pm2 status
   ```

3. **ログを確認**
   ```bash
   pm2 logs backend --lines 50
   ```

4. **復旧が簡単そうなら:**
   ```bash
   pm2 restart all
   ```

5. **復旧が難しそうなら:**
   - GitHubにコードをプッシュ
   - Vercelでデプロイ（30分で完了）

---

## 📝 次のステップ

### すぐに対応
1. VPSサーバーの状況確認
2. PM2ログの確認
3. 簡単な再起動で復旧できるか試す

### 復旧できない場合
1. GitHubにプッシュ
2. Vercelでフロントエンドをデプロイ
3. 環境変数でバックエンドURLを設定

### 長期的な対策
1. PM2の自動再起動設定を強化
2. サーバー監視ツールの導入（Uptime Robot等）
3. エラー通知の設定

---

## 🛠️ トラブルシューティング用コマンド集

```bash
# プロセス確認
pm2 status
ps aux | grep node

# ポート確認
netstat -tuln | grep -E '3000|3001'
lsof -i :3000
lsof -i :3001

# メモリ使用状況
free -h
df -h

# ログ確認
pm2 logs backend --lines 100
pm2 logs frontend --lines 100
tail -f /var/log/nginx/error.log

# プロセス再起動
pm2 restart all
pm2 reload all

# プロセス削除して再起動
pm2 delete all
pm2 start ecosystem.config.js

# Nginx再起動（必要な場合）
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## 📚 関連ドキュメント

- [PM2_SETUP_COMPLETE.md](./PM2_SETUP_COMPLETE.md) - PM2セットアップ
- [XSERVER_DEPLOY_GUIDE.md](./XSERVER_DEPLOY_GUIDE.md) - デプロイガイド
- [PM2_STOP_FREQUENCY_ISSUE.md](./PM2_STOP_FREQUENCY_ISSUE.md) - PM2停止問題

---

**作成者**: AI Assistant  
**作成日**: 2026年1月25日

