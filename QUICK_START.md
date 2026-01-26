# ✅ 起動完了！

## 🎉 開発サーバーが起動しました

**起動日時**: 2026年1月25日

---

## 📍 アクセスURL

### メインページ

- **トップページ**  
  http://localhost:3005/

- **ログイン**  
  http://localhost:3005/auth/login

- **薬局登録**  
  http://localhost:3005/auth/register/pharmacy

- **薬剤師登録**  
  http://localhost:3005/auth/register/pharmacist

---

### ダッシュボード

- **薬局ダッシュボード**  
  http://localhost:3005/pharmacy/dashboard

- **薬剤師ダッシュボード**  
  http://localhost:3005/pharmacist/dashboard

---

### 📄 プレビューページ

- **請求書プレビュー**  
  http://localhost:3005/preview/invoice

- **労働条件通知書プレビュー**  
  http://localhost:3005/preview/work-notice

### ✨ **NEW!** 請求書発行完了画面（独立ページ）

- **請求書発行完了画面** 🔓 **認証不要**  
  http://localhost:3005/invoice-issued

> 💡 ログイン不要で直接アクセスできる請求書発行完了画面です。詳しくは [INVOICE_ISSUED_PAGE.md](./INVOICE_ISSUED_PAGE.md) をご覧ください。

---

### 🔧 バックエンドAPI

- **APIエンドポイント**  
  http://localhost:3001/api

- **ヘルスチェック**  
  http://localhost:3001/

---

## 🔐 テストアカウント

### 薬局アカウント
```
メール: pharmacy@test.com
パスワード: password123
```

### 薬剤師アカウント
```
メール: pharmacist@test.com
パスワード: password123
```

---

## 📊 稼働状況

### 現在のポート使用状況

✅ **ポート3001**: バックエンドAPI（Express）  
✅ **ポート3005**: フロントエンド（Next.js）  
🔒 **ポート3000**: 別サイトで使用中（競合なし）

---

## 🛑 停止方法

```bash
./stop-dev.sh
```

または

```bash
# フロントエンドのみ停止
lsof -ti:3005 | xargs kill -9

# バックエンドのみ停止
lsof -ti:3001 | xargs kill -9
```

---

## 📝 ログの確認

```bash
# リアルタイムでログを表示
tail -f frontend.log
tail -f backend.log

# 両方同時に表示
tail -f frontend.log backend.log
```

---

## 🎯 次のステップ

### 1. プレビューページの確認

まず、請求書と労働条件通知書のプレビューを確認してください：

1. http://localhost:3005/preview/invoice
2. http://localhost:3005/preview/work-notice

### 2. 動作確認フロー

#### 薬局側の操作
1. http://localhost:3005/auth/login にアクセス
2. 薬局アカウントでログイン
3. ダッシュボードで各機能を確認

#### 薬剤師側の操作
1. 薬剤師アカウントでログイン
2. 求人を検索・応募
3. メッセージで薬局とやり取り

#### 構造化メッセージ（正式オファー）の確認
1. 薬局：応募を承認
2. 薬局：メッセージタブから「正式オファーを送信」
3. 薬剤師：メッセージタブで正式オファーを確認
4. 薬剤師：「承諾する」または「辞退する」
5. 承諾後：労働条件通知書が自動生成
6. 薬局：プラットフォーム手数料管理で請求書確認

---

## 💡 開発のヒント

### Hot Reload

コードを変更すると自動的にリロードされます（Turbopack有効）

### API呼び出しのデバッグ

ブラウザのDevTools（F12）を開いて確認：
- **Network タブ**: API通信を確認
- **Console タブ**: エラーメッセージを確認

### データベースの確認

```bash
psql -U your_user -d pharmacy_platform
```

---

## ⚠️ トラブルシューティング

### 画面が表示されない

1. URLが正しいか確認（ポート3005）
2. ログを確認: `tail -f frontend.log`
3. ブラウザのキャッシュをクリア

### APIエラーが発生する

1. バックエンドが起動しているか確認: `lsof -i :3001`
2. データベース接続を確認
3. ログを確認: `tail -f backend.log`

### ポートが使用中

```bash
# すべて停止
./stop-dev.sh

# 再起動
./start-dev.sh
```

---

## 📚 関連ドキュメント

- `DEV_SETUP_GUIDE.md` - 開発環境セットアップガイド
- `PREVIEW_PAGES_GUIDE.md` - プレビューページの使い方
- `STRUCTURED_MESSAGE_IMPLEMENTATION_COMPLETE.md` - 実装完了レポート

---

**🎊 準備完了です！開発を楽しんでください！**

