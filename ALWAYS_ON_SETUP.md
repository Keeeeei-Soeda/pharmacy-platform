# 🔧 常時稼働設定ガイド

## 📋 問題の原因

PM2プロセスが停止する主な原因：

1. **サーバー再起動時にPM2が自動起動していない**
   - PM2のstartup設定が未設定
   - サーバー再起動後、プロセスが手動で起動するまで停止状態

2. **アプリケーションのクラッシュ**
   - メモリ不足
   - 未処理のエラー
   - データベース接続エラー

3. **PM2プロセスの予期しない終了**
   - システムリソース不足
   - 権限エラー

---

## ✅ 解決策

### 1. PM2自動起動設定（最重要）

サーバー再起動時にPM2プロセスを自動起動するように設定します。

#### 手順：

```bash
# サーバーにSSH接続
ssh pharmacy@yaku-navi.com

# PM2の現在のプロセスを保存
cd ~/pharmacy-platform
pm2 save

# PM2自動起動設定を生成（表示されたコマンドをコピー）
pm2 startup systemd -u pharmacy --hp /home/pharmacy

# 表示されたsudoコマンドを実行（例：以下のようなコマンドが表示されます）
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

**⚠️ 重要**: 表示された`sudo`コマンドをそのまま実行してください。これにより、サーバー再起動時にPM2が自動起動します。

---

### 2. 改善されたecosystem.config.js

以下の改善を実装しました：

- ✅ **自動再起動設定**: `autorestart: true`
- ✅ **最小稼働時間**: `min_uptime: "10s"`（10秒未満の再起動はクラッシュとみなす）
- ✅ **最大再起動回数**: `max_restarts: 10`（10回以上再起動したら停止）
- ✅ **再起動遅延**: `restart_delay: 4000`（4秒待ってから再起動）
- ✅ **ログファイル**: エラーログと出力ログを分離
- ✅ **ポート修正**: フロントエンドを3000に統一

---

### 3. 監視スクリプトの設定

定期的にPM2プロセスをチェックし、停止していたら自動再起動します。

#### サーバー側でcronジョブを設定：

```bash
# サーバーにSSH接続
ssh pharmacy@yaku-navi.com

# cronジョブを編集
crontab -e

# 以下の行を追加（5分ごとにチェック）
*/5 * * * * cd /home/pharmacy/pharmacy-platform && bash monitor-pm2.sh >> /home/pharmacy/pm2-monitor.log 2>&1
```

これにより、5分ごとにPM2プロセスをチェックし、停止していたら自動再起動します。

---

### 4. 手動監視コマンド

ローカルから監視スクリプトを実行：

```bash
cd /Users/soedakei/pharmacy-platform
bash monitor-pm2.sh
```

---

## 🔍 状態確認コマンド

### PM2プロセス状態確認

```bash
ssh pharmacy@yaku-navi.com "pm2 status"
```

### ログ確認

```bash
# フロントエンドログ
ssh pharmacy@yaku-navi.com "pm2 logs pharmacy-frontend --lines 50"

# バックエンドログ
ssh pharmacy@yaku-navi.com "pm2 logs pharmacy-backend --lines 50"
```

### プロセス再起動

```bash
ssh pharmacy@yaku-navi.com "cd ~/pharmacy-platform && pm2 restart all"
```

---

## 📊 監視方法

### 1. 定期的なチェック

- **毎日**: PM2ステータスを確認
- **毎週**: ログファイルを確認してエラーがないかチェック
- **毎月**: サーバーリソース（メモリ、ディスク）を確認

### 2. アラート設定（推奨）

以下のような監視サービスを導入することを推奨します：

- **UptimeRobot**: 無料で5分ごとにサイトの稼働状況をチェック
- **Pingdom**: より高度な監視機能
- **自社監視**: カスタムスクリプトでメール通知

---

## 🚨 トラブルシューティング

### PM2プロセスが停止している場合

```bash
ssh pharmacy@yaku-navi.com
cd ~/pharmacy-platform
pm2 start ecosystem.config.js
pm2 save
```

### サーバー再起動後にアクセスできない場合

1. PM2プロセスを確認
   ```bash
   ssh pharmacy@yaku-navi.com "pm2 status"
   ```

2. 停止していたら起動
   ```bash
   ssh pharmacy@yaku-navi.com "cd ~/pharmacy-platform && pm2 start ecosystem.config.js"
   ```

3. PM2自動起動設定を再確認
   ```bash
   ssh pharmacy@yaku-navi.com "pm2 startup"
   ```

---

## ✅ 設定完了チェックリスト

- [ ] PM2自動起動設定を実行（sudoコマンド）
- [ ] `pm2 save`で現在のプロセスを保存
- [ ] cronジョブで監視スクリプトを設定
- [ ] サーバー再起動テスト（オプション）
- [ ] 監視スクリプトの動作確認

---

## 📝 注意事項

1. **PM2自動起動設定は1回だけ実行すればOK**
   - サーバー再起動後も自動的にPM2プロセスが起動します

2. **cronジョブは定期的に実行される**
   - 5分ごとにチェックするため、停止しても最大5分で復旧します

3. **ログファイルの管理**
   - ログファイルが大きくなりすぎないよう、定期的にローテーションを設定することを推奨

---

**最終更新**: 2026年1月23日

