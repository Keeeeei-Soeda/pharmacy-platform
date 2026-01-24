# PM2プロセスが停止する原因の詳細分析

## 🔍 問題の本質

**通常、PM2デーモンは停止しません。** PM2はデーモンプロセスとして動作し、管理下のアプリケーションが停止しても、PM2自体は動作し続けるはずです。

しかし、実際にはPM2プロセス自体が停止している状況が発生しています。

---

## 🔴 PM2プロセスが停止する主な原因

### 1. サーバー再起動（最も可能性が高い）⭐

**原因：**
- VPSサーバーの再起動（メンテナンス、アップデート、手動再起動など）
- PM2自動起動設定が未実行のため、再起動後にPM2デーモンが起動しない

**確認方法：**
```bash
# サーバーの稼働時間を確認
uptime

# システムログで再起動履歴を確認
last reboot

# PM2の起動時間を確認
pm2 status
```

**症状：**
- `pm2 status`で何も表示されない
- PM2デーモン自体が起動していない

**解決策：**
```bash
pm2 startup systemd -u pharmacy --hp /home/pharmacy
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

---

### 2. PM2デーモンのクラッシュ

**原因：**
- PM2デーモン自体のバグ
- システムリソース不足による強制終了
- メモリリーク

**確認方法：**
```bash
# PM2デーモンのログを確認
pm2 logs --lines 100

# システムログでPM2関連のエラーを確認
journalctl -u pm2-pharmacy -n 100
# または
dmesg | grep -i pm2
```

**症状：**
- PM2プロセスが突然消失
- エラーログにクラッシュ情報が記録される

**解決策：**
- PM2を再インストール
- システムリソースを確認・改善

---

### 3. システムリソース不足

**原因：**
- メモリ不足（OOM Killerがプロセスを強制終了）
- ディスク容量不足
- CPU使用率が高い

**確認方法：**
```bash
# メモリ使用状況
free -h

# ディスク使用状況
df -h

# システムログでOOM Killerの記録を確認
dmesg | grep -i "out of memory"
journalctl -k | grep -i "out of memory"
```

**症状：**
- システムが重い
- 他のプロセスも停止している
- ログにOOM Killerの記録がある

**解決策：**
- メモリ使用量を削減
- 不要なプロセスを停止
- サーバーのリソースを増強

---

### 4. 権限問題

**原因：**
- PM2デーモンの実行ユーザーに権限がない
- ファイルシステムの権限エラー
- sudo権限の問題

**確認方法：**
```bash
# PM2の実行ユーザーを確認
ps aux | grep pm2

# PM2のホームディレクトリの権限を確認
ls -la ~/.pm2

# システムログで権限エラーを確認
journalctl -u pm2-pharmacy | grep -i "permission\|denied"
```

**症状：**
- 権限エラーのログが記録される
- PM2がファイルにアクセスできない

**解決策：**
- 権限を修正
- PM2を正しいユーザーで実行

---

### 5. ログファイルの肥大化

**原因：**
- ログファイルが大きくなりすぎてディスク容量を圧迫
- ログローテーションが設定されていない

**確認方法：**
```bash
# ログファイルのサイズを確認
du -sh ~/.pm2/logs/*
du -sh ~/pharmacy-platform/logs/*

# ディスク使用状況
df -h
```

**症状：**
- ディスク容量が不足している
- ログファイルが非常に大きい

**解決策：**
```bash
# PM2ログローテーションを設定
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

### 6. システムの自動クリーンアップ

**原因：**
- システムの自動メンテナンススクリプト
- 不要なプロセスを自動的にkillする設定

**確認方法：**
```bash
# cronジョブを確認
crontab -l
sudo crontab -l

# systemdタイマーを確認
systemctl list-timers
```

**症状：**
- 定期的にPM2が停止する
- 特定の時間に停止する

**解決策：**
- 自動クリーンアップスクリプトを確認・修正

---

### 7. 他のプロセスによるkill

**原因：**
- 他のスクリプトやプロセスがPM2をkill
- 手動でのkill操作

**確認方法：**
```bash
# システムログでkillの記録を確認
journalctl | grep -i "kill.*pm2"
dmesg | grep -i "kill.*pm2"

# 実行中のプロセスを確認
ps aux | grep -E "pm2|kill"
```

**症状：**
- ログにkillの記録がある
- 特定の操作後に停止する

**解決策：**
- killしているプロセスを特定・修正

---

### 8. systemdサービスの問題

**原因：**
- PM2のsystemdサービスが正しく設定されていない
- サービスの自動起動が無効になっている

**確認方法：**
```bash
# systemdサービスの状態を確認
systemctl status pm2-pharmacy
systemctl is-enabled pm2-pharmacy

# サービスのログを確認
journalctl -u pm2-pharmacy -n 100
```

**症状：**
- systemdサービスが存在しない
- サービスが無効になっている

**解決策：**
```bash
# PM2自動起動設定を実行
pm2 startup systemd -u pharmacy --hp /home/pharmacy
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

---

## 📊 原因の可能性（推測）

| 原因 | 可能性 | 確認方法 |
|------|--------|----------|
| サーバー再起動 | 80% | `uptime`, `last reboot` |
| PM2デーモンのクラッシュ | 10% | `journalctl`, `dmesg` |
| システムリソース不足 | 5% | `free -h`, `df -h`, `dmesg` |
| 権限問題 | 2% | `ls -la ~/.pm2`, `journalctl` |
| ログファイル肥大化 | 1% | `du -sh ~/.pm2/logs/*` |
| その他 | 2% | 各種ログ確認 |

---

## 🔍 詳細な調査方法

### ステップ1: サーバーの再起動履歴を確認

```bash
ssh pharmacy@yaku-navi.com

# サーバーの稼働時間
uptime

# 再起動履歴
last reboot | head -10

# システムログで再起動を確認
journalctl --list-boots
```

### ステップ2: PM2デーモンの状態を確認

```bash
# PM2プロセスの確認
ps aux | grep pm2

# PM2の状態
pm2 status

# PM2のログ
pm2 logs --lines 100
```

### ステップ3: システムリソースを確認

```bash
# メモリ使用状況
free -h

# ディスク使用状況
df -h

# OOM Killerの記録
dmesg | grep -i "out of memory"
journalctl -k | grep -i "out of memory"
```

### ステップ4: システムログを確認

```bash
# systemdログ
journalctl -u pm2-pharmacy -n 100

# カーネルログ
dmesg | tail -50

# システムログ全体
journalctl -n 100 --no-pager
```

---

## ✅ 根本的な解決策

### 1. PM2自動起動設定（最重要）

サーバー再起動時に自動的にPM2が起動するように設定：

```bash
pm2 save
pm2 startup systemd -u pharmacy --hp /home/pharmacy
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

### 2. ログローテーション設定

ログファイルが肥大化しないように：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 save
```

### 3. 監視スクリプトの設定

定期的にPM2プロセスをチェック：

```bash
crontab -e
# 以下を追加
*/5 * * * * cd /home/pharmacy/pharmacy-platform && bash monitor-pm2.sh >> /home/pharmacy/pm2-monitor.log 2>&1
```

### 4. システムリソースの監視

定期的にリソース使用状況を確認：

```bash
# メモリ使用状況をログに記録
*/30 * * * * free -h >> /home/pharmacy/system-resources.log 2>&1
```

---

## 🎯 推奨される調査手順

1. **サーバーの再起動履歴を確認**
   - `uptime`で稼働時間を確認
   - `last reboot`で再起動履歴を確認

2. **PM2デーモンの状態を確認**
   - `ps aux | grep pm2`でPM2プロセスの存在を確認
   - `pm2 status`でPM2の状態を確認

3. **システムログを確認**
   - `journalctl`でPM2関連のエラーを確認
   - `dmesg`でOOM Killerの記録を確認

4. **リソース使用状況を確認**
   - `free -h`でメモリ使用状況を確認
   - `df -h`でディスク使用状況を確認

---

## 📝 まとめ

**PM2プロセスが停止する主な原因：**

1. **サーバー再起動**（80%）
   - PM2自動起動設定が未実行
   - 再起動後にPM2デーモンが起動しない

2. **PM2デーモンのクラッシュ**（10%）
   - システムリソース不足
   - PM2のバグ

3. **その他**（10%）
   - 権限問題
   - ログファイル肥大化
   - システムの自動クリーンアップ

**解決策：**
1. ✅ PM2自動起動設定を実行（最重要）
2. ✅ ログローテーションを設定
3. ✅ 監視スクリプトを設定
4. ✅ システムリソースを監視

---

**最終更新**: 2026年1月25日

