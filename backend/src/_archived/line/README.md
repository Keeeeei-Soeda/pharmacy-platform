# LINE 連携機能 - アーカイブ

## 📦 概要

このディレクトリには、将来の開発のためにアーカイブされた LINE 連携機能のコードが保管されています。

**アーカイブ日**: 2025 年 11 月 26 日  
**理由**: 現時点で LINE 連携機能は不要と判断されたため

---

## 📂 アーカイブファイル一覧

### Controllers

- **lineAuthController.js**: LINE 認証（ログイン）機能

  - LINE OAuth 認証フロー
  - コールバック処理
  - ユーザーアカウント連携

- **lineBotController.js**: LINE Bot 機能
  - Webhook 処理
  - メッセージ送受信
  - LINE 通知機能

### Routes

- **lineAuth.js**: LINE 認証 API ルート

  - `POST /api/line-auth/login` - LINE 認証開始
  - `GET /api/line-auth/callback` - 認証コールバック

- **lineBot.js**: LINE Bot API ルート
  - `POST /api/line/webhook` - LINE Webhook
  - `POST /api/line/send-message` - メッセージ送信

---

## 🔄 復元方法

将来、LINE 連携機能が必要になった場合の復元手順：

### 1. ファイルを元の場所に復元

```bash
# Controllers
cp controllers/lineAuthController.js ../../controllers/
cp controllers/lineBotController.js ../../controllers/

# Routes
cp routes/lineAuth.js ../../routes/
cp routes/lineBot.js ../../routes/
```

### 2. app.js にルートを追加

`backend/src/app.js` に以下を追加：

```javascript
// LINE連携ルート
app.use("/api/line-auth", require("./routes/lineAuth"));
app.use("/api/line", require("./routes/lineBot"));
```

### 3. 環境変数を設定

`backend/.env` に以下を追加：

```env
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN="your_channel_access_token"
LINE_CHANNEL_SECRET="your_channel_secret"
LINE_LOGIN_CHANNEL_ID="your_login_channel_id"
LINE_LOGIN_CHANNEL_SECRET="your_login_channel_secret"
LINE_LOGIN_CALLBACK_URL="http://localhost:3001/api/line/callback"
```

### 4. LINE Developers Console で設定

1. [LINE Developers Console](https://developers.line.biz/) でチャンネルを作成
2. Messaging API 設定
   - Channel Access Token を取得
   - Webhook URL を設定: `https://your-domain.com/api/line/webhook`
3. LINE Login 設定
   - Channel ID と Channel Secret を取得
   - Callback URL を設定

### 5. データベースマイグレーション

LINE 連携用のカラム（`line_user_id`）は既に存在しています：

```sql
-- users テーブル
line_user_id VARCHAR(255) UNIQUE
```

---

## 📋 機能概要

### LINE 認証機能

- ユーザーが LINE アカウントでログイン可能
- 既存アカウントと LINE アカウントの連携
- OAuth 2.0 認証フロー

### LINE Bot 機能

- LINE 公式アカウントからの通知送信
- メッセージの双方向やり取り
- リッチメニュー対応
- 勤務シフト通知
- 契約書送信

---

## 🔐 セキュリティ注意事項

LINE 連携を復元する際は、以下のセキュリティ対策を実施してください：

1. ✅ **Webhook 署名検証**: LINE Webhook の署名を必ず検証
2. ✅ **HTTPS 必須**: 本番環境では必ず HTTPS を使用
3. ✅ **環境変数の保護**: `.env` ファイルは絶対に Git にコミットしない
4. ✅ **トークンのローテーション**: 定期的にアクセストークンを更新

---

## 📞 関連リソース

- [LINE Developers ドキュメント](https://developers.line.biz/ja/docs/)
- [Messaging API リファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [LINE Login ドキュメント](https://developers.line.biz/ja/docs/line-login/)

---

## 📝 変更履歴

- **2025-11-26**: 初回アーカイブ
  - LINE 認証機能をアーカイブ
  - LINE Bot 機能をアーカイブ
  - 本番環境から除外

---

**メンテナ**: Pharmacy Platform 開発チーム  
**ステータス**: アーカイブ（将来の開発用に保管）
