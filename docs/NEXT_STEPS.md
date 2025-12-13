# 次のステップ - デバッグ作業

**作成日**: 2025 年 11 月 27 日

---

## 🎯 次にやるべきこと（優先順）

### 1️⃣ Prisma プロフィール作成エラーの解決 🔴 **最優先**

**現状:**

- プロフィール作成がコメントアウトされている
- ユーザー登録は成功するが、プロフィール情報がない

**手順:**

```bash
# 1. Prisma スキーマを確認
cd /Users/soedakei/pharmacy-platform
cat prisma/schema.prisma | grep -A 20 "model PharmacistProfile"
cat prisma/schema.prisma | grep -A 20 "model PharmacyProfile"

# 2. DATABASE_URL を確認
cat backend/.env | grep DATABASE_URL

# 3. Prisma Client を再生成
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public" npx prisma generate

# 4. データベース接続テスト
psql -d pharmacy_platform -c "\dt pharmacist_profiles"
psql -d pharmacy_platform -c "\dt pharmacy_profiles"

# 5. 直接 SQL でプロフィール作成を試す
psql -d pharmacy_platform -c "
INSERT INTO pharmacist_profiles (id, user_id, first_name, last_name, experience_years, specialties, has_drivers_license, has_home_care_experience)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'pharmacist1@test.com'), '田中', '花子', 4, ARRAY[]::varchar[], false, false);
"
```

**成功したら:**

- `authController.js` のコメントアウトを解除
- バックエンドを再起動
- 新しいアカウントで登録テスト

---

### 2️⃣ プロフィール表示・編集機能のテスト 🟡

**前提条件:**

- Prisma エラーが解決済み

**テスト手順:**

#### 薬剤師プロフィール

1. `pharmacist3@test.com` でログイン
2. ダッシュボードの「プロフィール」タブをクリック
3. プロフィール情報が表示されるか確認
4. プロフィール編集ボタンをクリック
5. 情報を編集して保存
6. 変更が反映されるか確認

#### 薬局プロフィール

1. `pharmacy3@test.com` でログイン
2. 同様にプロフィール表示・編集をテスト

**期待される動作:**

- ✅ プロフィール情報が表示される
- ✅ 編集フォームが開く
- ✅ 変更が保存される
- ✅ ダッシュボードに反映される

---

### 3️⃣ 募集要項作成機能のテスト 🟡

**前提条件:**

- 薬局アカウントでログイン済み

**テスト手順:**

1. `pharmacy3@test.com` でログイン
2. 「求人管理」タブをクリック
3. 「新規求人作成」ボタンをクリック
4. 以下の情報を入力：
   ```
   タイトル: 【急募】調剤薬局の薬剤師募集
   雇用形態: パート・アルバイト
   時給: 2500円 〜 3000円
   勤務地: 東京都品川区
   勤務日: 月・水・金
   勤務時間: 09:00 〜 18:00
   ```
5. 「投稿」ボタンをクリック

**期待される動作:**

- ✅ 求人が作成される
- ✅ 求人一覧に表示される
- ✅ 求人詳細が確認できる

**確認ポイント:**

- バックエンドのログにエラーがないか
- データベースに求人が保存されているか
  ```sql
  SELECT * FROM job_postings ORDER BY created_at DESC LIMIT 1;
  ```

---

### 4️⃣ 応募機能のテスト 🟡

**前提条件:**

- 薬局側で求人が作成済み

**テスト手順:**

1. `pharmacist3@test.com` でログイン
2. 「求人検索」タブをクリック
3. 作成した求人を探す
4. 「詳細を見る」をクリック
5. 「応募する」ボタンをクリック
6. 応募理由などを入力
7. 送信

**期待される動作:**

- ✅ 応募が送信される
- ✅ 薬局側の「応募管理」に表示される
- ✅ 通知が表示される

**薬局側で確認:**

1. `pharmacy3@test.com` でログイン
2. 「応募管理」タブをクリック
3. 新しい応募が表示されているか確認
4. 「承認」または「拒否」をテスト

---

### 5️⃣ メッセージ機能のテスト 🟢

**前提条件:**

- 応募が承認済み

**テスト手順:**

#### 薬剤師側から

1. `pharmacist3@test.com` でログイン
2. 「メッセージ」タブをクリック
3. 承認された薬局とのスレッドを開く
4. メッセージを送信

#### 薬局側から

1. `pharmacy3@test.com` でログイン
2. 「メッセージ」タブをクリック
3. 薬剤師からのメッセージを確認
4. 返信を送信

**期待される動作:**

- ✅ メッセージが送信される
- ✅ 相手側に表示される
- ✅ スレッドが更新される

---

### 6️⃣ 契約機能のテスト 🟢

**前提条件:**

- メッセージで合意形成済み

**テスト手順:**

1. 薬局側で契約を作成
2. 契約条件を入力
3. 薬剤師側で契約を確認
4. 契約を承認
5. 労働条件通知書が生成されるか確認

**期待される動作:**

- ✅ 契約が作成される
- ✅ 労働条件通知書が自動生成される
- ✅ 両者に通知される
- ✅ スケジュール管理が可能になる

---

## 📊 テスト進捗チェックリスト

### 認証・ログイン

- [x] 薬剤師新規登録
- [x] 薬局新規登録
- [x] ログイン
- [x] ダッシュボードアクセス

### プロフィール機能

- [ ] プロフィール表示（薬剤師）
- [ ] プロフィール編集（薬剤師）
- [ ] プロフィール表示（薬局）
- [ ] プロフィール編集（薬局）

### 求人機能

- [ ] 求人作成（薬局）
- [ ] 求人一覧表示（薬局）
- [ ] 求人編集（薬局）
- [ ] 求人削除（薬局）
- [ ] 求人検索（薬剤師）
- [ ] 求人詳細表示（薬剤師）

### 応募機能

- [ ] 応募送信（薬剤師）
- [ ] 応募一覧表示（薬局）
- [ ] 応募承認（薬局）
- [ ] 応募拒否（薬局）
- [ ] 応募状態表示（薬剤師）

### メッセージ機能

- [ ] メッセージ送信（薬剤師）
- [ ] メッセージ送信（薬局）
- [ ] スレッド一覧表示
- [ ] 未読通知

### 契約機能

- [ ] 契約作成（薬局）
- [ ] 契約確認（薬剤師）
- [ ] 契約承認（薬剤師）
- [ ] 労働条件通知書生成
- [ ] 契約一覧表示

### スケジュール機能

- [ ] スケジュール登録
- [ ] スケジュール表示
- [ ] カレンダー表示

---

## 🔧 トラブルシューティング

### Prisma エラーが解決しない場合

1. **データベースを完全リセット:**

   ```bash
   # 警告: すべてのデータが削除されます
   psql -d pharmacy_platform -c "DROP SCHEMA public CASCADE;"
   psql -d pharmacy_platform -c "CREATE SCHEMA public;"
   npx prisma migrate dev
   ```

2. **Prisma Client を完全に再生成:**

   ```bash
   rm -rf node_modules/@prisma/client
   rm -rf node_modules/.prisma
   npm install
   npx prisma generate
   ```

3. **新しいデータベースを作成:**
   ```bash
   createdb pharmacy_platform_new
   # .env の DATABASE_URL を更新
   npx prisma migrate dev
   ```

---

## 💡 デバッグのコツ

### エラーが出たら

1. **バックエンドのログを必ず確認**

   ```bash
   tail -f /tmp/backend.log
   ```

2. **データベースの状態を確認**

   ```sql
   SELECT * FROM [テーブル名] ORDER BY created_at DESC LIMIT 5;
   ```

3. **API レスポンスを確認**

   - ブラウザの開発者ツール > Network タブ

4. **段階的にテスト**
   - 一度に複数の機能をテストしない
   - 1 つずつ確認して進める

---

**準備完了！新しいセッションで続きを進めてください 🚀**
