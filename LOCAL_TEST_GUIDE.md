# ローカルテスト実行ガイド

**作成日**: 2026年1月26日  
**目的**: 日給柔軟化機能のローカルテスト

---

## 📋 ポート設定

### フロントエンド
- **ポート**: 3006（設定済み）
- **URL**: http://localhost:3006

### バックエンド
- **ポート**: 3001（デフォルト）
- **URL**: http://localhost:3001

---

## 🚀 起動手順

### ステップ1: 環境変数の確認

#### バックエンド（backend/.env）
以下の内容があることを確認してください：

```env
# データベース接続
DATABASE_URL="postgresql://user:password@localhost:5432/pharmacy_platform"

# JWT
JWT_SECRET="your-secret-key-here"

# ポート設定（デフォルト3001）
PORT=3001

# LINE（必要に応じて）
LINE_CHANNEL_ACCESS_TOKEN="your-line-token"
LINE_CHANNEL_SECRET="your-line-secret"
```

#### フロントエンド（.env.local）
以下の内容があることを確認してください：

```env
# バックエンドAPI URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### ステップ2: バックエンドの起動

```bash
# ターミナル1を開く
cd /Users/soedakei/pharmacy-platform/backend

# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーを起動
npm run dev
```

**起動確認**:
```
✓ Server is running on port 3001
✓ Database connected
```

---

### ステップ3: フロントエンドの起動

```bash
# ターミナル2を開く（新しいターミナルウィンドウ）
cd /Users/soedakei/pharmacy-platform

# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーを起動
npm run dev
```

**起動確認**:
```
✓ Ready on http://localhost:3006
```

---

## ✅ 動作確認チェックリスト

### 1. ログインテスト
- [ ] http://localhost:3006/auth/login にアクセス
- [ ] 薬局アカウントでログイン
  - メール: `test-pharmacy@example.com`
  - パスワード: `test1234`

### 2. 正式オファーモーダルの確認
- [ ] 薬局ダッシュボードにログイン
- [ ] 「応募確認」タブに移動
- [ ] 応募者の詳細を開く
- [ ] 応募を承認
- [ ] 「メッセージ」タブに移動
- [ ] メッセージスレッドを開く
- [ ] 「📝 正式オファーを送信」ボタンをクリック

### 3. 日給入力フィールドの確認
**新規追加された項目**:
- [ ] **日給** 入力フィールドが表示される
- [ ] デフォルト値: 20,000円
- [ ] 下限値の表示: "下限: 20,000円"

### 4. バリデーションテスト

#### テスト1: 日給が20,000円未満
**手順**:
1. 日給に「19,999」を入力
2. 他のフィールドを入力
3. 「オファーを送信」ボタンをクリック

**期待される結果**:
- [ ] アラート表示: 「日給は20,000円以上に設定してください」
- [ ] オファーが送信されない

#### テスト2: 勤務日数が15日未満
**手順**:
1. 日給に「20,000」を入力
2. 勤務日数に「14」を入力
3. 他のフィールドを入力
4. 「オファーを送信」ボタンをクリック

**期待される結果**:
- [ ] アラート表示: 「勤務日数は15日〜90日の範囲で設定してください」
- [ ] オファーが送信されない

#### テスト3: 正常な入力
**手順**:
1. 初回出勤日: 2週間後の日付を選択
2. 日給: 20,000円
3. 勤務日数: 15日
4. 勤務時間: 9:00-18:00
5. 支払い期限: 初回出勤日の3日前
6. 「オファーを送信」ボタンをクリック

**期待される結果**:
- [ ] アラート表示:
  ```
  正式オファーを送信しました
  日給: 20,000円
  勤務日数: 15日
  報酬総額: 300,000円
  プラットフォーム手数料: 120,000円
  ```
- [ ] オファーが正常に送信される

### 5. 報酬総額の自動計算
**確認項目**:
- [ ] 日給を変更すると報酬総額が自動更新される
- [ ] 勤務日数を変更すると報酬総額が自動更新される
- [ ] プラットフォーム手数料（40%）が自動計算される

**計算例**:
| 日給 | 勤務日数 | 報酬総額 | 手数料（40%） |
|------|---------|---------|--------------|
| 20,000円 | 15日 | 300,000円 | 120,000円 |
| 22,000円 | 20日 | 440,000円 | 176,000円 |
| 25,000円 | 30日 | 750,000円 | 300,000円 |

### 6. 薬剤師側の表示確認
**手順**:
1. 薬剤師アカウントでログイン
   - メール: `test-pharmacist@example.com`
   - パスワード: `test1234`
2. 「メッセージ」タブに移動
3. 正式オファーが届いているメッセージを開く

**確認項目**:
- [ ] 「📝 正式オファーが届きました」と表示される
- [ ] **日給**が表示される（例: ¥20,000）
- [ ] **勤務日数**が表示される（例: 15日）
- [ ] **報酬総額**が表示される（例: ¥300,000）
- [ ] **計算式**が表示される（例: （日給 ¥20,000 × 15日））

### 7. データベース確認（オプション）
```sql
-- 契約データの確認
SELECT 
  id,
  daily_rate,
  work_days_count,
  total_compensation,
  status
FROM work_contracts
ORDER BY created_at DESC
LIMIT 5;
```

**期待される結果**:
- [ ] `daily_rate`: 入力した日給（例: 20000）
- [ ] `work_days_count`: 入力した勤務日数（例: 15）
- [ ] `total_compensation`: 計算された報酬総額（例: 300000）

---

## 🐛 トラブルシューティング

### バックエンドが起動しない
**エラー**: `Error: listen EADDRINUSE: address already in use :::3001`

**解決方法**:
```bash
# ポート3001を使用しているプロセスを確認
lsof -i :3001

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
PORT=3002 npm run dev
```

その場合、`.env.local` の `NEXT_PUBLIC_API_URL` も変更してください:
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### フロントエンドが起動しない
**エラー**: `Port 3006 is already in use`

**解決方法**:
```bash
# ポート3006を使用しているプロセスを確認
lsof -i :3006

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
npm run dev -- -p 3007
```

### データベース接続エラー
**エラー**: `Can't reach database server`

**解決方法**:
```bash
# PostgreSQLが起動しているか確認
pg_isready

# 起動していない場合は起動
# macOSの場合
brew services start postgresql

# または
pg_ctl -D /usr/local/var/postgres start
```

### CORS エラー
**エラー**: `Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3006' has been blocked by CORS policy`

**確認事項**:
1. バックエンドの `backend/src/app.js` で CORS が有効になっているか確認
2. フロントエンドの `.env.local` で正しいAPI URLが設定されているか確認

---

## 📸 スクリーンショット確認ポイント

### 1. 正式オファーモーダル
![正式オファーモーダル]
- 日給入力フィールド
- 勤務日数入力フィールド（15日〜90日）
- 報酬総額の自動計算ボックス

### 2. バリデーションエラー
![バリデーションエラー]
- 日給20,000円未満のアラート
- 勤務日数15日未満のアラート

### 3. 薬剤師側の正式オファー表示
![正式オファー表示]
- 日給の表示
- 報酬総額の表示
- 計算式の表示

---

## ✅ テスト完了後の確認事項

### すべてのテストが成功した場合
- [ ] バックエンドのバリデーションが機能している
- [ ] フロントエンドのバリデーションが機能している
- [ ] 報酬総額が正しく計算されている
- [ ] データベースに正しく保存されている
- [ ] 薬剤師側で正しく表示されている

### 次のアクション
1. **VPSへのデプロイ**: 問題なければ本番環境にデプロイ
2. **ドキュメント更新**: 必要に応じてユーザーマニュアルを更新
3. **既存データの確認**: 既存の契約データに影響がないか確認

---

## 🚀 VPSデプロイ準備

テストが成功したら、以下のコマンドでVPSにデプロイできます：

```bash
# 1. バックエンドファイルのアップロード
scp backend/src/controllers/structuredMessageController.js root@162.43.8.168:/root/pharmacy-platform/backend/src/controllers/
scp backend/src/utils/pdfGenerator.js root@162.43.8.168:/root/pharmacy-platform/backend/src/utils/
scp backend/src/controllers/contractController.js root@162.43.8.168:/root/pharmacy-platform/backend/src/controllers/

# 2. フロントエンドファイルのアップロード
scp app/pharmacy/dashboard/page.tsx root@162.43.8.168:/root/pharmacy-platform/app/pharmacy/dashboard/
scp app/pharmacist/dashboard/page.tsx root@162.43.8.168:/root/pharmacy-platform/app/pharmacist/dashboard/
scp lib/api/structuredMessages.ts root@162.43.8.168:/root/pharmacy-platform/lib/api/

# 3. SSH接続
ssh root@162.43.8.168

# 4. バックエンド再起動
cd /root/pharmacy-platform/backend
pm2 restart pharmacy-backend

# 5. フロントエンドビルド&再起動
cd /root/pharmacy-platform
npm run build
pm2 restart pharmacy-frontend

# 6. 動作確認
pm2 status
```

---

## 📝 備考

### 環境変数ファイルの確認
以下のファイルが存在することを確認してください：

```bash
# バックエンド環境変数
ls -la backend/.env

# フロントエンド環境変数
ls -la .env.local
```

### 環境変数が存在しない場合
サンプルファイルを作成してください：

**backend/.env**:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pharmacy_platform"
JWT_SECRET="your-jwt-secret-key-change-this-in-production"
PORT=3001
```

**.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

**作成日**: 2026年1月26日  
**目的**: 日給柔軟化機能のローカルテスト  
**フロントエンドポート**: 3005  
**バックエンドポート**: 3001

