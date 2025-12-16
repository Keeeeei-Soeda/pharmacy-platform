# 🔄 復元ポイントガイド

## 📌 利用可能な復元ポイント

### **v1.0-production-ssl** (2025年12月16日作成)
**内容:**
- yaku-navi.com でHTTPS稼働中
- SSL証明書設定完了
- フロントエンド・バックエンド正常稼働
- データベース接続完了
- 全ての基本機能テスト済み

---

## 🚨 クラッシュ時の復元方法

### 方法1: AIに指示する（推奨）
```
「v1.0-production-ssl の状態に戻して」
```
とAIに伝えると、自動的に以下の手順を実行します。

---

### 方法2: 手動で復元する

#### ステップ1: ローカルで復元
```bash
cd /Users/soedakei/pharmacy-platform

# 現在の変更を一時保存（必要な場合）
git stash

# タグの状態に戻す
git checkout v1.0-production-ssl

# または、mainブランチをタグの状態にリセット
git checkout main
git reset --hard v1.0-production-ssl
```

#### ステップ2: VPSに復元
```bash
# VPSにSSH接続
ssh root@162.43.8.168

# プロジェクトディレクトリへ移動
cd /root/pharmacy-platform

# 最新のコードを取得
git fetch origin

# タグの状態に戻す
git checkout v1.0-production-ssl

# または、mainブランチをタグの状態にリセット
git checkout main
git reset --hard v1.0-production-ssl

# 依存関係を再インストール
npm install
cd backend && npm install && cd ..

# フロントエンドを再ビルド
npm run build

# PM2で再起動
pm2 restart all

# 状態確認
pm2 status
pm2 logs --lines 20
```

---

## 📝 新しい復元ポイントの作成方法

AIに以下のように指示してください：
```
「現在の状態でGitHubにアップして、復元ポイントを作成してください」
```

または手動で作成：
```bash
# ローカルで変更をコミット
git add .
git commit -m "変更内容の説明"

# タグを作成（例: v1.1-feature-xxx）
git tag -a v1.1-feature-xxx -m "復元ポイント: 機能XXX追加完了"

# GitHubにプッシュ
git push origin main
git push origin v1.1-feature-xxx

# VPSに反映
ssh root@162.43.8.168 "cd /root/pharmacy-platform && git pull origin main"
```

---

## 🔍 復元ポイント一覧の確認

```bash
# 全てのタグを表示
git tag -l

# タグの詳細情報を表示
git show v1.0-production-ssl
```

---

## ⚠️ 注意事項

1. **データベースは復元されません**
   - コードのみが復元されます
   - データベースのバックアップは別途必要です

2. **環境変数ファイル (.env) は復元されません**
   - .gitignoreで除外されているため
   - 手動で再設定が必要な場合があります

3. **node_modules は復元されません**
   - 復元後に `npm install` が必要です

---

## 📞 サポート

問題が発生した場合は、AIに以下の情報を伝えてください：
- 実行したコマンド
- エラーメッセージ
- 復元したいタグ名

