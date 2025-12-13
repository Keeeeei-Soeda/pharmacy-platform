# 必須ファイルチェックリスト

このドキュメントは、プラットフォームを動作させるために**絶対に必要なファイル**のチェックリストです。

---

## ✅ チェック方法

各ファイルの横に以下のマークをつけてください：

- ✅ = 存在して正常動作
- ⚠️ = 存在するがエラーあり
- ❌ = 存在しない（作成必要）

---

## 📁 フロントエンド - 必須ファイル

### 設定ファイル（5 個）

- [ ] `package.json` - 依存関係定義
- [ ] `next.config.ts` - Next.js 設定
- [ ] `tailwind.config.ts` - Tailwind CSS 設定
- [ ] `tsconfig.json` - TypeScript 設定
- [ ] `.env.local` - 環境変数（`NEXT_PUBLIC_API_URL=http://localhost:3001`）

### 共通ページ（2 個）

- [ ] `app/layout.tsx` - ルートレイアウト
- [ ] `app/page.tsx` - トップページ

### 認証ページ（2 個）

- [ ] `app/auth/login/page.tsx` - ログインページ
- [ ] `app/auth/register/page.tsx` - 新規登録ページ

### ダッシュボード（2 個）

- [ ] `app/pharmacist/dashboard/page.tsx` - 薬剤師ダッシュボード（全機能）
- [ ] `app/pharmacy/dashboard/page.tsx` - 薬局ダッシュボード（全機能）

### API Client（11 個）

- [ ] `lib/api-client.ts` - ベースクライアント
- [ ] `lib/api/index.ts` - エクスポート統合
- [ ] `lib/api/auth.ts` - 認証 API
- [ ] `lib/api/jobs.ts` - 求人 API
- [ ] `lib/api/applications.ts` - 応募 API
- [ ] `lib/api/messages.ts` - メッセージ API
- [ ] `lib/api/contracts.ts` - 契約 API
- [ ] `lib/api/schedules.ts` - スケジュール API
- [ ] `lib/api/profiles.ts` - プロフィール API
- [ ] `lib/api/uploads.ts` - アップロード API
- [ ] `lib/api/admin.ts` - 管理 API

**フロントエンド合計**: 22 個

---

## 🔧 バックエンド - 必須ファイル

### 設定ファイル（2 個）

- [ ] `backend/package.json` - 依存関係定義（**@prisma/client を含めない**）
- [ ] `backend/.env` - 環境変数（`DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`）

### サーバー起動（2 個）

- [ ] `backend/src/server.js` - サーバーエントリーポイント
- [ ] `backend/src/app.js` - Express アプリ設定

### ルート（10 個）

- [ ] `backend/src/routes/auth.js` - 認証ルート
- [ ] `backend/src/routes/jobs.js` - 求人ルート
- [ ] `backend/src/routes/applications.js` - 応募ルート
- [ ] `backend/src/routes/messages.js` - メッセージルート
- [ ] `backend/src/routes/contracts.js` - 契約ルート
- [ ] `backend/src/routes/pharmacists.js` - 薬剤師プロフィールルート
- [ ] `backend/src/routes/pharmacies.js` - 薬局プロフィールルート
- [ ] `backend/src/routes/schedules.js` - スケジュールルート
- [ ] `backend/src/routes/uploads.js` - アップロードルート
- [ ] `backend/src/routes/admin.js` - 管理ルート

### コントローラー（10 個）

- [ ] `backend/src/controllers/authController.js` - 認証ロジック
- [ ] `backend/src/controllers/jobController.js` - 求人ロジック
- [ ] `backend/src/controllers/applicationController.js` - 応募ロジック
- [ ] `backend/src/controllers/messageController.js` - メッセージロジック
- [ ] `backend/src/controllers/contractController.js` - 契約ロジック
- [ ] `backend/src/controllers/pharmacistController.js` - 薬剤師プロフィールロジック
- [ ] `backend/src/controllers/pharmacyController.js` - 薬局プロフィールロジック
- [ ] `backend/src/controllers/scheduleController.js` - スケジュールロジック
- [ ] `backend/src/controllers/uploadController.js` - アップロードロジック
- [ ] `backend/src/controllers/adminController.js` - 管理ロジック

### ミドルウェア（2 個）

- [ ] `backend/src/middleware/auth.js` - 認証・認可ミドルウェア
- [ ] `backend/src/middleware/validation.js` - バリデーション

### データベース（3 個）

- [ ] `backend/src/database/connection.js` - PostgreSQL 接続プール
- [ ] `backend/src/database/queries.js` - 共通クエリ
- [ ] `backend/src/config/database.js` - DB 設定

### ユーティリティ（4 個）

- [ ] `backend/src/utils/generateToken.js` - JWT トークン生成
- [ ] `backend/src/utils/hashPassword.js` - パスワードハッシュ
- [ ] `backend/src/utils/sendEmail.js` - メール送信
- [ ] `backend/src/config/auth.js` - 認証設定

**バックエンド合計**: 33 個

---

## 🗃️ データベース - 必須ファイル

### Prisma（1 個）

- [ ] `prisma/schema.prisma` - データベーススキーマ定義（全モデル）

### 環境変数（1 個）

- [ ] `.env` - データベース接続 URL（プロジェクトルート）

**データベース合計**: 2 個

---

## 📊 総合チェック

### ファイル数統計

| カテゴリ       | 必須ファイル数 |
| -------------- | -------------- |
| フロントエンド | 22 個          |
| バックエンド   | 33 個          |
| データベース   | 2 個           |
| **合計**       | **57 個**      |

### 動作確認チェックリスト

#### 環境構築

- [ ] PostgreSQL が起動している
- [ ] `npx prisma generate`を実行済み
- [ ] フロントエンドで`npm install`実行済み
- [ ] バックエンドで`npm install`実行済み

#### サーバー起動

- [ ] バックエンドが http://localhost:3001 で起動
- [ ] フロントエンドが http://localhost:3000 で起動
- [ ] バックエンドログにエラーがない
- [ ] フロントエンドログにエラーがない

#### 機能テスト - 薬局側

##### 1. 認証

- [ ] 薬局アカウントでログインできる（`test-pharmacy@example.com` / `test1234`）
- [ ] ダッシュボードが表示される

##### 2. 求人投稿

- [ ] 「募集掲載」タブを開ける
- [ ] 「新規募集掲載」ボタンをクリックできる
- [ ] 募集内容フォームが表示される
- [ ] すべての項目を入力できる：
  - [ ] 求人タイトル
  - [ ] 求人詳細
  - [ ] 雇用形態
  - [ ] 最低時給
  - [ ] 最高時給
  - [ ] 勤務地（都道府県・市区町村・住所）
  - [ ] 勤務曜日（複数選択可能）
  - [ ] 勤務時間（開始・終了）
  - [ ] 応募締切日（3 日後〜2 週間後）
  - [ ] 必要資格
  - [ ] 福利厚生
- [ ] 「投稿する」ボタンで求人を作成できる
- [ ] 作成した求人が一覧に表示される

##### 3. 応募者管理

- [ ] 「応募確認」タブを開ける
- [ ] 応募者一覧が表示される（応募があれば）
- [ ] 応募者の詳細を確認できる
- [ ] 承認前は薬剤師名が匿名化される（例: 田 ◯◯ 花 ◯◯）
- [ ] 承認前は連絡先が非表示
- [ ] 「承認」ボタンで応募を承認できる
- [ ] 承認後は薬剤師のフルネームが表示される
- [ ] 承認後は連絡先（電話番号・メールアドレス）が表示される

##### 4. メッセージ

- [ ] 「メッセージ」タブを開ける
- [ ] メッセージスレッド一覧が表示される（承認後の応募のみ）
- [ ] スレッドをクリックでメッセージ内容が表示される
- [ ] メッセージを送信できる
- [ ] 「この薬剤師を採用する」ボタンが表示される
- [ ] ボタンクリックで採用オファーを送信できる

##### 5. 契約管理

- [ ] 「契約管理」タブを開ける
- [ ] 送信したオファー一覧が表示される
- [ ] 契約詳細を確認できる
- [ ] 薬剤師が承諾後、契約ステータスが「契約中」になる

#### 機能テスト - 薬剤師側

##### 1. 認証

- [ ] 薬剤師アカウントでログインできる（`test-pharmacist@example.com` / `test1234`）
- [ ] ダッシュボードが表示される

##### 2. 求人検索・応募

- [ ] 「募集検索」タブを開ける
- [ ] 求人一覧が表示される
- [ ] キーワード検索ができる
- [ ] 都道府県フィルターが使える
- [ ] 雇用形態フィルターが使える
- [ ] 求人詳細を表示できる
- [ ] 「応募する」ボタンが表示される
- [ ] 志望動機を入力できる
- [ ] 応募を送信できる
- [ ] 応募済みの求人には「応募済み」と表示される

##### 3. メッセージ

- [ ] 「メッセージ」タブを開ける
- [ ] 承認された応募のメッセージスレッドが表示される
- [ ] メッセージを送受信できる
- [ ] 未読カウントが表示される

##### 4. 契約管理

- [ ] 「契約管理」タブを開ける
- [ ] 薬局から採用オファーが届くと自動ポップアップが表示される
- [ ] 「働き始める」ボタンで承諾できる
- [ ] 承諾後に労働条件通知書が表示される
- [ ] 「今回はお断りする」ボタンで辞退できる
- [ ] 辞退後にメッセージスレッドが非表示になる

---

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 問題 1: 500 エラーが多発

**症状**: すべての API で 500 エラー
**原因**: Prisma Client が未初期化
**解決策**:

```bash
cd /Users/soedakei/pharmacy-platform
npx prisma generate
cd backend
rm -rf node_modules/@prisma node_modules/.prisma
ln -sf ../../node_modules/@prisma node_modules/@prisma
ln -sf ../../node_modules/.prisma node_modules/.prisma
# サーバー再起動
pkill -f nodemon && cd /Users/soedakei/pharmacy-platform/backend && npm run dev
```

#### 問題 2: データベース接続エラー

**症状**: "Database connection failed"
**原因**: PostgreSQL が起動していない、または接続 URL が間違っている
**解決策**:

```bash
# PostgreSQL起動確認
psql -U username -d pharmacy_platform -c "SELECT 1"

# 接続URL確認
cat .env | grep DATABASE_URL
```

#### 問題 3: 認証エラー

**症状**: "アクセストークンが必要です" または "無効なトークンです"
**原因**: JWT トークンが期限切れまたは不正
**解決策**:

- ブラウザの LocalStorage をクリア
- 再度ログイン

#### 問題 4: CORS エラー

**症状**: "blocked by CORS policy"
**原因**: バックエンドの CORS 設定が間違っている
**解決策**:
`backend/.env`に以下を追加:

```env
FRONTEND_URL=http://localhost:3000
```

#### 問題 5: ポート競合

**症状**: "Port 3000 is already in use"
**解決策**:

```bash
# プロセス確認
lsof -i :3000

# プロセス終了
kill -9 <PID>
```

---

## 🎯 完全テストフロー

### ステップ 1: 薬局側で求人投稿

1. ログイン: `test-pharmacy@example.com` / `test1234`
2. 「募集掲載」タブ → 「新規募集掲載」
3. 以下を入力:
   - タイトル: 「調剤薬局での薬剤師募集」
   - 説明: 「アットホームな雰囲気の薬局です」
   - 雇用形態: パートタイム
   - 最低時給: 2500 円
   - 最高時給: 3000 円
   - 都道府県: 東京都
   - 市区町村: 新宿区
   - 住所: 新宿 1-1-1
   - 勤務曜日: 月〜金
   - 勤務開始時刻: 09:00
   - 勤務終了時刻: 18:00
   - 応募締切: 7 日後
4. 「投稿する」クリック
5. ✅ 成功メッセージ表示
6. ✅ 求人が一覧に表示される

### ステップ 2: 薬剤師側で応募

1. ログイン: `test-pharmacist@example.com` / `test1234`
2. 「募集検索」タブを開く
3. ✅ 先ほど投稿した求人が表示される
4. 求人をクリック → 詳細モーダル表示
5. 「応募する」ボタンクリック
6. 志望動機入力: 「ぜひ働かせていただきたいです」
7. 「応募を送信」クリック
8. ✅ 成功メッセージ表示
9. ✅ ボタンが「応募済み」に変わる

### ステップ 3: 薬局側で応募承認

1. 薬局ダッシュボードに戻る
2. 「応募確認」タブを開く
3. ✅ 応募者が 1 件表示される
4. ✅ 応募者名が匿名化されている（テス ◯◯ 太 ◯◯）
5. ✅ 連絡先が非表示
6. 「詳細を見る」クリック
7. プロフィール情報確認
8. 「承認」ボタンクリック
9. ✅ 成功メッセージ表示
10. ✅ 応募者名がフルネーム表示になる（テスト太郎）
11. ✅ 電話番号・メールアドレスが表示される

### ステップ 4: 双方でメッセージ交換

#### 薬剤師側

1. 「メッセージ」タブを開く
2. ✅ 承認された求人のスレッドが表示される
3. メッセージ入力: 「面接日程のご相談をさせてください」
4. 「送信」クリック
5. ✅ メッセージが送信される

#### 薬局側

1. 「メッセージ」タブを開く
2. ✅ スレッドに未読バッジ表示
3. スレッドをクリック
4. ✅ 薬剤師からのメッセージが表示される
5. 返信: 「来週火曜日 14 時はいかがでしょうか？」
6. 「送信」クリック
7. ✅ メッセージが送信される

### ステップ 5: 薬局から採用オファー送信

1. メッセージスレッド画面で「この薬剤師を採用する」ボタンをクリック
2. 確認ダイアログで「OK」
3. ✅ 成功メッセージ表示
4. 「契約管理」タブを開く
5. ✅ 送信したオファーが「承諾待ち」ステータスで表示される

### ステップ 6: 薬剤師がオファー承諾

1. 薬剤師ダッシュボードに戻る
2. ✅ 採用オファーの自動ポップアップが表示される
3. 内容を確認
4. 「働き始める」ボタンをクリック
5. 確認ダイアログで「OK」
6. ✅ 成功メッセージ表示
7. ✅ 労働条件通知書が表示される
8. 「契約管理」タブを開く
9. ✅ 契約が「契約中」ステータスで表示される
10. 詳細を開いて労働条件通知書を確認

### ステップ 7: 薬局側で契約確認

1. 薬局ダッシュボード → 「契約管理」タブ
2. ✅ 契約が「契約中」ステータスに更新されている
3. 詳細を開いて労働条件通知書を確認

---

## 🚨 現在発生しているエラーと対処

### エラー 1: "Cannot read properties of undefined (reading 'findFirst')"

**原因**: Prisma Client が正しく初期化されていない

**対処法**:

```bash
# 1. プロジェクトルートでPrisma Client生成
cd /Users/soedakei/pharmacy-platform
npx prisma generate

# 2. バックエンドからシンボリックリンク作成
cd backend/node_modules
ln -sf ../../node_modules/@prisma @prisma
ln -sf ../../node_modules/.prisma .prisma

# 3. バックエンド再起動
pkill -f nodemon
cd /Users/soedakei/pharmacy-platform/backend
npm run dev
```

### エラー 2: "dailyRate は型 'CreateJobData' に存在しません"

**原因**: フロントエンドが新しい報酬モデル（日給フィールド）を送信しているが、バックエンドの型定義が古い

**対処法**: `dailyRate`フィールドをバックエンドのコントローラーで受け付けるように修正する（または削除）

---

## 📝 次にやるべきこと

### 最優先タスク（現在）

1. **Prisma Client 初期化問題の解決** 🔴

   - [ ] シンボリックリンクの作成
   - [ ] バックエンド再起動
   - [ ] 動作確認

2. **完全テストフローの実行** 🟡
   - [ ] 薬局: 求人投稿 → 応募承認 → メッセージ → 採用オファー送信
   - [ ] 薬剤師: 求人検索 → 応募 → メッセージ → オファー承諾
   - [ ] 双方: 契約確認

### 次期実装タスク

3. **スケジュール管理 UI の実装** 🟡

   - [ ] カレンダーライブラリ導入
   - [ ] 薬局側: スケジュール一括作成モーダル
   - [ ] 薬剤師側: カレンダー表示

4. **報酬計算・請求機能の実装** 🟢
   - [ ] 出勤日数ベースの報酬計算
   - [ ] 請求書 PDF 生成
   - [ ] 請求書送信

---

**最終更新**: 2024 年 12 月 4 日  
**プロジェクト状態**: デバッグ中（Prisma Client 初期化問題）

