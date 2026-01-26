# 🚀 クイックローカルテストガイド

**所要時間**: 5分  
**目的**: 日給柔軟化機能のテスト

---

## 📋 起動ポート

- **フロントエンド**: http://localhost:3006
- **バックエンド**: http://localhost:3001

---

## ⚡ 最速起動方法

### 方法1: 自動起動スクリプト（推奨）

```bash
cd /Users/soedakei/pharmacy-platform
./start-local-test.sh
```

**選択肢**:
1. バックエンドとフロントエンドを同時起動 ← **推奨**
2. バックエンドのみ起動
3. フロントエンドのみ起動

**終了方法**: `Ctrl+C`

---

### 方法2: 手動起動

#### ターミナル1（バックエンド）
```bash
cd /Users/soedakei/pharmacy-platform/backend
npm run dev
```

#### ターミナル2（フロントエンド）
```bash
cd /Users/soedakei/pharmacy-platform
npm run dev
```

---

## ✅ 5分間テスト手順

### 1. ログイン（30秒）
```
URL: http://localhost:3006/auth/login
メール: test-pharmacy@example.com
パスワード: test1234
```

### 2. 正式オファーモーダルを開く（1分）
1. 「応募確認」タブ
2. 応募者の詳細を開く
3. 「承認」ボタン
4. 「メッセージ」タブ
5. 「📝 正式オファーを送信」ボタン

### 3. 日給入力テスト（2分）

#### テスト1: 正常な入力
```
日給: 20,000円
勤務日数: 15日
→ 報酬総額: 300,000円
→ 手数料: 120,000円
```

#### テスト2: エラー確認
```
日給: 19,999円
→ アラート: 「日給は20,000円以上に設定してください」
```

```
勤務日数: 14日
→ アラート: 「勤務日数は15日〜90日の範囲で設定してください」
```

### 4. 薬剤師側の確認（1.5分）
```
ログアウト → 薬剤師でログイン
メール: test-pharmacist@example.com
パスワード: test1234

「メッセージ」タブ
→ 日給が表示されているか確認
→ 報酬総額が表示されているか確認
→ 計算式が表示されているか確認
```

---

## 🐛 トラブルシューティング

### ポートが使用中
```bash
# バックエンド（ポート3001）を確認
lsof -i :3001

# フロントエンド（ポート3006）を確認
lsof -i :3006

# プロセスを終了
kill -9 <PID>
```

### PostgreSQLが起動していない
```bash
# 起動
brew services start postgresql

# または
pg_ctl -D /usr/local/var/postgres start
```

### 環境変数がない
```bash
# .env.local を作成
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# backend/.env を作成（手動で編集が必要）
touch backend/.env
```

---

## 📸 確認ポイント

### ✅ 正式オファーモーダル
- [ ] 日給入力フィールドが表示される
- [ ] デフォルト値: 20,000円
- [ ] 勤務日数の下限: 15日
- [ ] 報酬総額が自動計算される
- [ ] 手数料（40%）が自動計算される

### ✅ バリデーション
- [ ] 日給 < 20,000円 → アラート
- [ ] 勤務日数 < 15日 → アラート
- [ ] 勤務日数 > 90日 → アラート

### ✅ 薬剤師側の表示
- [ ] 日給が表示される
- [ ] 報酬総額が表示される
- [ ] 計算式が表示される（例: 日給 ¥20,000 × 15日）

---

## 🎯 テスト成功の基準

すべて ✅ なら成功：
- [ ] バックエンドが起動している（Port 3001）
- [ ] フロントエンドが起動している（Port 3005）
- [ ] 日給入力フィールドが表示される
- [ ] 日給20,000円未満でエラーが出る
- [ ] 勤務日数15日未満でエラーが出る
- [ ] 報酬総額が自動計算される
- [ ] 薬剤師側で日給が表示される

---

## 🚀 テスト成功後

### VPSへのデプロイ
```bash
# デプロイスクリプトを実行
./deploy-daily-rate-update.sh
```

または手動デプロイ:
```bash
# ファイルをアップロード
scp backend/src/controllers/structuredMessageController.js root@162.43.8.168:/root/pharmacy-platform/backend/src/controllers/
scp backend/src/utils/pdfGenerator.js root@162.43.8.168:/root/pharmacy-platform/backend/src/utils/
scp backend/src/controllers/contractController.js root@162.43.8.168:/root/pharmacy-platform/backend/src/controllers/
scp app/pharmacy/dashboard/page.tsx root@162.43.8.168:/root/pharmacy-platform/app/pharmacy/dashboard/
scp app/pharmacist/dashboard/page.tsx root@162.43.8.168:/root/pharmacy-platform/app/pharmacist/dashboard/
scp lib/api/structuredMessages.ts root@162.43.8.168:/root/pharmacy-platform/lib/api/

# SSH接続して再起動
ssh root@162.43.8.168
cd /root/pharmacy-platform/backend && pm2 restart pharmacy-backend
cd /root/pharmacy-platform && npm run build && pm2 restart pharmacy-frontend
```

---

**作成日**: 2026年1月26日  
**所要時間**: 5分  
**難易度**: ★☆☆☆☆

