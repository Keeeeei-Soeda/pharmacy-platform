# 502エラー高頻度発生の原因分析と対策

## 🔴 502エラーの主な原因

### 1. PM2プロセスの停止（最も可能性が高い）⭐

**症状：**
- PM2プロセスが完全に停止している
- Nginxは動作しているが、アプリケーション（ポート3000）に接続できない

**原因：**
- サーバー再起動時にPM2が自動起動しない設定
- アプリケーションのクラッシュ
- メモリ不足による強制終了

**確認方法：**
```bash
ssh pharmacy@yaku-navi.com
pm2 status
# プロセスが表示されない、または status が "stopped" の場合
```

---

### 2. メモリ不足によるクラッシュ

**症状：**
- プロセスが頻繁に再起動される
- メモリ使用量が高い

**現在の設定：**
- フロントエンド: `max_memory_restart: "1G"`（1GB超過で再起動）
- バックエンド: `max_memory_restart: "500M"`（500MB超過で再起動）
- サーバー総メモリ: 6GB

**問題点：**
- メモリ制限が厳しすぎる可能性
- 他のプロセス（Nginx、PostgreSQLなど）もメモリを使用

**確認方法：**
```bash
free -h
pm2 monit
```

---

### 3. アプリケーションのクラッシュ

**症状：**
- エラーログにクラッシュ情報が記録される
- プロセスが頻繁に再起動される

**これまでのログから確認されたエラー：**
- `ReferenceError: returnNaN is not defined`（Next.js内部エラー）
- `EACCES: permission denied`（ファイルアクセス権限エラー）
- Prisma接続エラー

**確認方法：**
```bash
pm2 logs pharmacy-frontend --lines 100
pm2 logs pharmacy-backend --lines 100
```

---

### 4. サーバー再起動時の自動起動未設定

**症状：**
- サーバー再起動後に502エラーが発生
- 手動でPM2を起動すると復旧

**原因：**
- PM2自動起動設定が未実行
- `pm2 startup`コマンドが実行されていない

**確認方法：**
```bash
sudo systemctl status pm2-pharmacy
# または
systemctl list-units | grep pm2
```

---

### 5. Nginxとアプリケーションの接続問題

**症状：**
- PM2プロセスは動作しているが、502エラーが発生

**原因：**
- ポート番号の不一致
- アプリケーションが起動していない
- ファイアウォール設定

**確認方法：**
```bash
curl http://localhost:3000
netstat -tlnp | grep 3000
```

---

## 📊 原因の優先順位（推測）

1. **PM2プロセスの停止**（80%）
   - サーバー再起動時に自動起動しない
   - アプリケーションクラッシュによる停止

2. **メモリ不足**（10%）
   - メモリ制限が厳しすぎる
   - 他のプロセスとの競合

3. **アプリケーションのクラッシュ**（5%）
   - Next.js内部エラー
   - Prisma接続エラー

4. **その他**（5%）
   - Nginx設定問題
   - ネットワーク問題

---

## ✅ 根本的な対策

### 対策1: PM2自動起動設定（最重要）⭐

```bash
ssh pharmacy@yaku-navi.com
cd ~/pharmacy-platform
pm2 save
pm2 startup systemd -u pharmacy --hp /home/pharmacy
# 表示されたsudoコマンドを実行
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

**効果：**
- サーバー再起動時に自動的にPM2プロセスが起動
- 502エラーの発生を大幅に削減

---

### 対策2: メモリ制限の調整

現在の設定を改善：

```javascript
// ecosystem.config.js
{
  name: "pharmacy-frontend",
  max_memory_restart: "1.5G",  // 1G → 1.5Gに増加
  // ...
},
{
  name: "pharmacy-backend",
  max_memory_restart: "800M",  // 500M → 800Mに増加
  // ...
}
```

**効果：**
- メモリ不足によるクラッシュを削減
- より安定した動作

---

### 対策3: 監視スクリプトの定期実行

5分ごとにPM2プロセスをチェック：

```bash
# cronジョブに追加
*/5 * * * * cd /home/pharmacy/pharmacy-platform && bash monitor-pm2.sh >> /home/pharmacy/pm2-monitor.log 2>&1
```

**効果：**
- プロセス停止を検知して自動復旧
- 最大5分以内に復旧

---

### 対策4: エラーハンドリングの改善

アプリケーション側のエラーを修正：

1. Next.js内部エラーの修正
2. Prisma接続エラーの修正
3. ファイルアクセス権限の修正

---

### 対策5: ログローテーション設定

ログファイルが大きくなりすぎないように：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🎯 即座に実施すべき対策

### 優先度1: PM2自動起動設定（必須）

```bash
ssh pharmacy@yaku-navi.com
cd ~/pharmacy-platform
pm2 save
pm2 startup systemd -u pharmacy --hp /home/pharmacy
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
# パスワード: Yakunavi168
```

### 優先度2: 監視スクリプトの設定

```bash
ssh pharmacy@yaku-navi.com
crontab -e
# 以下を追加
*/5 * * * * cd /home/pharmacy/pharmacy-platform && bash monitor-pm2.sh >> /home/pharmacy/pm2-monitor.log 2>&1
```

### 優先度3: メモリ制限の調整

`ecosystem.config.js`を更新してデプロイ

---

## 📈 期待される効果

| 対策 | 効果 |
|------|------|
| PM2自動起動設定 | サーバー再起動後の502エラーを100%削減 |
| 監視スクリプト | プロセス停止時の自動復旧（最大5分以内） |
| メモリ制限調整 | メモリ不足によるクラッシュを削減 |
| エラー修正 | アプリケーションの安定性向上 |

---

## 🔍 監視方法

### 定期的な確認

```bash
# PM2ステータス確認
pm2 status

# メモリ使用状況確認
free -h
pm2 monit

# エラーログ確認
pm2 logs --lines 50
```

### アラート設定（推奨）

- UptimeRobot: 5分ごとにサイトの稼働状況をチェック
- メール通知: 502エラー発生時に通知

---

## 📝 まとめ

**502エラーの主な原因：**
1. PM2プロセスの停止（サーバー再起動時に自動起動しない）
2. メモリ不足によるクラッシュ
3. アプリケーションのクラッシュ

**根本的な解決策：**
1. ✅ PM2自動起動設定（最重要）
2. ✅ 監視スクリプトの設定
3. ✅ メモリ制限の調整
4. ✅ アプリケーションエラーの修正

**効果：**
- サーバー再起動後の502エラーを100%削減
- プロセス停止時の自動復旧（最大5分以内）
- より安定した動作

---

**最終更新**: 2026年1月25日

