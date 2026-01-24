# PM2停止頻度の異常分析と緊急対策

## 🚨 現状の問題

**報告された状況：**
- 1週間で2回のPM2停止による502エラーが発生

**判定：これは異常です。**

---

## 📊 正常と異常の判定基準

### 正常な状態

| 項目 | 頻度 |
|------|------|
| サーバー再起動 | 月1〜2回程度 |
| PM2停止 | 月1回以下（再起動時のみ） |
| 502エラー | 月1回以下（再起動時のみ） |

### 異常な状態（現在の状況）

| 項目 | 頻度 | 判定 |
|------|------|------|
| PM2停止 | **1週間で2回** | ⚠️ 異常 |
| 502エラー | **1週間で2回** | ⚠️ 異常 |

**判定基準：**
- 月に2回以上のPM2停止 → 要調査
- 週に1回以上のPM2停止 → 異常（早急に対策が必要）
- **週に2回以上のPM2停止 → 深刻な問題あり**

---

## 🔍 異常な頻度で停止する原因

### 1. サーバーが頻繁に再起動している（可能性：高）

**原因：**
- システムアップデートによる自動再起動
- システムクラッシュ
- VPSプロバイダー側の問題
- 手動再起動

**確認方法：**
```bash
ssh pharmacy@yaku-navi.com
last reboot | head -10
uptime
journalctl --list-boots | head -10
```

**対策：**
- PM2自動起動設定を実行（最重要）
- 自動再起動設定を確認・無効化

---

### 2. PM2デーモンがクラッシュしている（可能性：高）

**原因：**
- メモリ不足によるOOM Killer
- PM2のバグ
- システムリソース不足
- ログファイルの肥大化

**確認方法：**
```bash
# メモリ使用状況
free -h

# OOM Killerの記録
dmesg | grep -i "out of memory"
journalctl -k | grep -i "out of memory"

# PM2のログ
pm2 logs --lines 200
```

**対策：**
- メモリ使用量を削減
- メモリ制限を調整
- ログローテーションを設定

---

### 3. アプリケーションのクラッシュによる連鎖反応（可能性：中）

**原因：**
- Next.js内部エラー
- Prisma接続エラー
- 未処理のエラー

**確認方法：**
```bash
pm2 logs pharmacy-frontend --lines 200
pm2 logs pharmacy-backend --lines 200
```

**対策：**
- エラーを修正
- エラーハンドリングを改善

---

### 4. システムの自動クリーンアップ（可能性：低）

**原因：**
- cronジョブでPM2をkill
- システムの自動メンテナンス

**確認方法：**
```bash
crontab -l
sudo crontab -l
systemctl list-timers
```

**対策：**
- 自動クリーンアップスクリプトを確認・修正

---

## 🚨 緊急対策（即座に実施）

### 対策1: PM2自動起動設定（最優先）

サーバー再起動が原因の場合、これで解決します。

```bash
ssh pharmacy@yaku-navi.com
cd ~/pharmacy-platform
pm2 save
pm2 startup systemd -u pharmacy --hp /home/pharmacy
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
# パスワード: Yakunavi168
```

**効果：**
- サーバー再起動後も自動起動
- サーバー再起動による502エラーを100%削減

---

### 対策2: 監視スクリプトの設定（必須）

PM2が停止した場合、自動復旧します。

```bash
ssh pharmacy@yaku-navi.com
crontab -e
# 以下を追加
*/5 * * * * cd /home/pharmacy/pharmacy-platform && bash monitor-pm2.sh >> /home/pharmacy/pm2-monitor.log 2>&1
```

**効果：**
- PM2停止時に自動復旧（最大5分以内）
- 502エラーの発生時間を最小化

---

### 対策3: ログローテーション設定

ログファイルが肥大化してディスク容量を圧迫している可能性があります。

```bash
ssh pharmacy@yaku-navi.com
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 save
```

**効果：**
- ログファイルのサイズを制限
- ディスク容量不足を防止

---

### 対策4: メモリ制限の調整

メモリ不足によるクラッシュを防ぎます。

現在の設定：
- フロントエンド: 1GB
- バックエンド: 500MB

推奨設定：
- フロントエンド: 1.5GB
- バックエンド: 800MB

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

---

## 📊 原因特定のための調査手順

接続が復旧したら、以下を実行して原因を特定してください：

### ステップ1: サーバー再起動頻度を確認

```bash
ssh pharmacy@yaku-navi.com

# 稼働時間
uptime

# 再起動履歴
last reboot | head -10
```

**判定：**
- 稼働時間が短い（数日以内）→ サーバーが頻繁に再起動している
- 稼働時間が長い（1週間以上）→ PM2デーモンがクラッシュしている

---

### ステップ2: メモリ使用状況を確認

```bash
# メモリ使用状況
free -h

# OOM Killerの記録
dmesg | grep -i "out of memory" | tail -20
journalctl -k | grep -i "out of memory" | tail -20
```

**判定：**
- OOM Killerの記録がある → メモリ不足が原因
- OOM Killerの記録がない → 他の原因

---

### ステップ3: ディスク使用状況を確認

```bash
# ディスク使用状況
df -h

# ログファイルのサイズ
du -sh ~/.pm2/logs/*
du -sh ~/pharmacy-platform/logs/*
```

**判定：**
- ディスク使用率が90%以上 → ディスク容量不足
- ログファイルが非常に大きい → ログ肥大化が原因

---

### ステップ4: PM2のログを確認

```bash
# PM2のログ
pm2 logs --lines 200 | grep -E "stopped|exit|crash|error|Error"

# フロントエンドのログ
pm2 logs pharmacy-frontend --lines 100

# バックエンドのログ
pm2 logs pharmacy-backend --lines 100
```

**判定：**
- エラーログが多い → アプリケーションのクラッシュが原因
- エラーログがない → PM2デーモンのクラッシュが原因

---

## 🎯 期待される効果

| 対策 | 効果 | 502エラー削減率 |
|------|------|----------------|
| PM2自動起動設定 | サーバー再起動後も自動起動 | 80%以上 |
| 監視スクリプト | PM2停止時に自動復旧（最大5分以内） | 15% |
| ログローテーション | ディスク容量不足を防止 | 5% |
| メモリ制限調整 | メモリ不足によるクラッシュを防止 | 適宜 |

**合計：** 95%以上の502エラーを削減可能

---

## 📝 まとめ

**現状：**
- 1週間で2回のPM2停止による502エラー
- **これは異常です（正常な状態の約8倍の頻度）**

**主な原因（推測）：**
1. サーバーが頻繁に再起動している
2. PM2デーモンがクラッシュしている
3. メモリ不足によるOOM Killer

**緊急対策：**
1. ✅ PM2自動起動設定（最優先）
2. ✅ 監視スクリプトの設定（必須）
3. ✅ ログローテーション設定
4. ✅ メモリ制限の調整

**調査方法：**
1. サーバー再起動頻度を確認
2. メモリ使用状況を確認
3. ディスク使用状況を確認
4. PM2のログを確認

**期待される効果：**
- 95%以上の502エラーを削減可能
- より安定した動作

---

**最終更新**: 2026年1月25日

