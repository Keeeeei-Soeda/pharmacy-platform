# 🚀 Vercelへのフロントエンド単独デプロイ手順

**所要時間**: 約30分

---

## 📋 前提条件

- GitHubアカウント
- Vercelアカウント（無料）
- GitHubにリポジトリをプッシュ済み

---

## ステップ1: GitHubにコードをプッシュ（5分）

### 1-1. Gitの初期化（まだの場合）

```bash
cd /Users/soedakei/pharmacy-platform
git init
```

### 1-2. .gitignoreを確認

以下のファイルが`.gitignore`に含まれているか確認：

```
node_modules/
.next/
out/
.env.local
.env*.local
```

### 1-3. コミット&プッシュ

```bash
git add .
git commit -m "フロントエンドVercelデプロイ準備"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/pharmacy-platform.git
git push -u origin main
```

---

## ステップ2: Vercelアカウント作成（3分）

### 2-1. Vercelにアクセス

https://vercel.com

### 2-2. GitHubでサインアップ

「Sign Up with GitHub」をクリック

### 2-3. GitHubアカウントと連携

権限を許可

---

## ステップ3: Vercelでプロジェクトをインポート（10分）

### 3-1. 新しいプロジェクトを作成

1. Vercelダッシュボードで「**Add New Project**」をクリック
2. 「**Import Git Repository**」を選択

### 3-2. リポジトリを選択

1. GitHubリポジトリ一覧から `pharmacy-platform` を選択
2. 「**Import**」をクリック

### 3-3. プロジェクト設定

#### Framework Preset
- **Next.js** を選択（自動検出されるはず）

#### Root Directory
- **/** （デフォルト）

#### Build and Output Settings
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 3-4. 環境変数を設定

「**Environment Variables**」セクションで以下を追加：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://あなたのVPSサーバーのURL` または `http://あなたのサーバーIP:3001` |

**例:**
```
NEXT_PUBLIC_API_URL=http://123.456.789.0:3001
```

### 3-5. デプロイ開始

「**Deploy**」ボタンをクリック

---

## ステップ4: デプロイ完了を待つ（5分）

### 4-1. ビルドプロセスを確認

- ログが表示される
- 緑色の「✅ Build Completed」が表示されるまで待つ

### 4-2. デプロイ完了

- 「🎉 Congratulations!」が表示される
- URLが発行される

**例:**
```
https://pharmacy-platform-xxx.vercel.app
```

---

## ステップ5: 動作確認（5分）

### 5-1. デプロイされたURLにアクセス

```
https://pharmacy-platform-xxx.vercel.app
```

### 5-2. 確認項目

- ✅ トップページが表示される
- ✅ 請求書発行ページにアクセスできる
  - `https://pharmacy-platform-xxx.vercel.app/invoice-issued`
- ✅ プレビューページにアクセスできる
  - `https://pharmacy-platform-xxx.vercel.app/preview/invoice`

### 5-3. バックエンド連携の確認（VPSサーバーが動作している場合）

1. ログインページにアクセス
2. テストアカウントでログイン
3. ダッシュボードにアクセス

**注意**: VPSサーバーが停止している場合、ログイン機能は動作しません。

---

## 🎯 デプロイ後の設定

### カスタムドメインの設定（オプション）

1. Vercelプロジェクトダッシュボードで「**Settings**」→「**Domains**」
2. 独自ドメインを追加
3. DNSレコードを設定

### 自動デプロイの設定

- ✅ デフォルトで有効
- GitHubに`git push`すると自動的に再デプロイされる

### 環境変数の更新

1. Vercelプロジェクトダッシュボードで「**Settings**」→「**Environment Variables**」
2. 変数を追加/編集
3. 「**Redeploy**」で反映

---

## 🚨 トラブルシューティング

### ビルドエラーが発生する

#### エラー1: "Module not found"

**原因**: 依存関係の不足

**解決策**:
```bash
# ローカルで確認
npm install
npm run build

# 問題がなければプッシュ
git add .
git commit -m "依存関係を修正"
git push
```

#### エラー2: "Type error"

**原因**: TypeScript型エラー

**解決策**:
```bash
# ローカルで型チェック
npm run lint

# エラーを修正してプッシュ
```

### デプロイは成功するがページが表示されない

**原因**: ルーティング設定の問題

**解決策**:
1. Vercelダッシュボードで「**Deployments**」→「**Logs**」を確認
2. エラーメッセージを確認

### APIが接続できない

**原因**: CORS設定またはバックエンドURL設定

**解決策1**: 環境変数を確認
```
NEXT_PUBLIC_API_URL=http://あなたのサーバーIP:3001
```

**解決策2**: バックエンドのCORS設定を確認
```javascript
// backend/src/app.js
app.use(cors({
  origin: [
    'http://localhost:3005',
    'https://pharmacy-platform-xxx.vercel.app' // Vercel URLを追加
  ]
}));
```

---

## 📱 モバイル対応の確認

### レスポンシブデザインのテスト

1. デプロイされたURLにスマホでアクセス
2. 各ページの表示を確認
3. タップ操作が正常に動作するか確認

---

## 🔄 更新方法

### コードを更新してデプロイ

```bash
# コードを編集
vim app/invoice-issued/page.tsx

# コミット&プッシュ
git add .
git commit -m "請求書ページを更新"
git push

# Vercelが自動的に再デプロイ（約2分）
```

### デプロイ状況の確認

1. Vercelダッシュボードで「**Deployments**」
2. 最新のデプロイ状況を確認
3. 完了後、URLにアクセスして確認

---

## 📊 Vercelの特徴

### メリット

- ✅ **自動デプロイ**: GitHubにプッシュすると自動デプロイ
- ✅ **高速**: CDN経由で全世界に配信
- ✅ **無料プラン**: 個人利用なら十分
- ✅ **プレビュー**: Pull Request毎にプレビューURL発行
- ✅ **簡単**: 設定が非常に簡単

### 制限（無料プラン）

- ❌ ビルド時間: 月6000分まで
- ❌ バンド幅: 月100GBまで
- ❌ サーバーレス関数: 月100GBまで
- ✅ 個人利用には十分

---

## 🎯 次のステップ

### すぐにやること

1. VPSサーバーの復旧を試みる
2. 復旧できない場合はVercelにデプロイ
3. ユーザーにVercel URLを案内

### 長期的な対応

1. VPSサーバーの問題を解決
2. サーバー監視を強化
3. 自動再起動の設定を改善

---

## 📚 参考リンク

- **Vercel公式ドキュメント**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **環境変数の設定**: https://vercel.com/docs/projects/environment-variables

---

**作成者**: AI Assistant  
**作成日**: 2026年1月25日

---

## 🎊 まとめ

### 最速の対応フロー

1. **GitHubにプッシュ**（5分）
2. **Vercelでインポート**（10分）
3. **環境変数を設定**（3分）
4. **デプロイ**（5分）
5. **動作確認**（5分）

**合計: 約30分で完了！**

これで、VPSサーバーが復旧するまでの間、フロントエンドだけでも公開できます！

