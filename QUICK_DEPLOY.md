# 🚀 今すぐデプロイする方法

## ✅ 完了している作業

1. ✅ コードをGitHubにプッシュ済み
2. ✅ 画像ファイルを配置済み
3. ✅ ビルド成功

---

## 🎯 デプロイ方法（簡単）

### ターミナルを開いて以下のコマンドを実行してください：

```bash
cd /Users/soedakei/pharmacy-platform
bash deploy.sh
```

**パスワードを聞かれたら:**
```
Pharm@cy2025!Secure#VPS
```

これだけで自動的にデプロイされます！

---

## 📋 デプロイスクリプトが実行する内容

1. サーバーにSSH接続
2. 最新コードを取得（git pull）
3. 依存関係を更新（npm install）
4. アプリケーションをビルド（npm run build）
5. フロントエンドを再起動（pm2 restart）
6. ログとステータスを表示

---

## ⏱️ 所要時間

約3〜5分で完了します

---

## ✅ デプロイ完了後の確認

ブラウザで以下にアクセス：
```
https://yaku-navi.com/
```

### 確認事項：
- [ ] トップページが新しいデザインで表示される
- [ ] 画像が3枚とも正しく表示される
- [ ] 「薬剤師として無料登録」ボタンが動作する
- [ ] 「採用担当者として登録」ボタンが動作する

---

## 🐛 問題が発生した場合

### ログを確認：
```bash
ssh pharmacy@yaku-navi.com
pm2 logs pharmacy-frontend
```

### 再起動：
```bash
ssh pharmacy@yaku-navi.com
cd ~/pharmacy-platform
pm2 restart pharmacy-frontend
```

---

**作成日**: 2026-01-11

