# 🔍 PM2自動監視・再起動ガイド

**作成日**: 2026年1月25日

---

## ✅ 現在の設定状況

### 既に有効な自動再起動機能

`ecosystem.config.js` で以下が設定済みです：

```javascript
{
  autorestart: true,              // ✅ プロセス停止時に自動再起動
  max_memory_restart: "500M",     // ✅ メモリ超過時に自動再起動
  max_restarts: 15,               // ✅ 最大15回まで再試行
  min_uptime: "10s",              // ✅ 10秒以上稼働したら成功とみなす
  restart_delay: 5000,            // ✅ 5秒待ってから再起動
  exp_backoff_restart_delay: 100  // ✅ 段階的に間隔を延ばす
}
```

### PM2が自動的に検知・再起動する状況

1. ✅ **プロセスがクラッシュした時**
2. ✅ **エラーで終了した時**
3. ✅ **メモリ制限を超えた時**
4. ✅ **予期しない終了が発生した時**
5. ✅ **定期再起動（毎日午前4時）**

---

## 🚀 さらに高度な監視機能

### Option 1: PM2のヘルスチェック機能（推奨）

プロセスが動いていても、実際には応答していない「ゾンビ状態」を検知します。

#### 設定方法

`ecosystem.config.js` に追加：

```javascript
module.exports = {
  apps: [
    {
      name: "pharmacy-backend",
      script: "src/server.js",
      // ... 既存の設定 ...
      
      // ヘルスチェック設定
      health_check: {
        enabled: true,
        interval: 60000,        // 60秒ごとにチェック
        timeout: 10000,         // 10秒でタイムアウト
        max_fails: 3,           // 3回失敗したら再起動
        endpoint: "http://localhost:3001/health"  // ヘルスチェックURL
      }
    }
  ]
};
```

#### バックエンドにヘルスチェックエンドポイントを追加

`backend/src/app.js` に追加：

```javascript
// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  // データベース接続チェック
  pool.query('SELECT 1', (err) => {
    if (err) {
      return res.status(503).json({ 
        status: 'unhealthy',
        error: 'Database connection failed' 
      });
    }
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });
});
```

---

### Option 2: 外部監視サービス（最も確実）

PM2自体が停止した場合も検知できます。

#### 推奨サービス

##### 1. **Uptime Robot**（無料）

**特徴:**
- ✅ 完全無料（50サイトまで）
- ✅ 5分ごとに監視
- ✅ メール/SMS/Slack通知
- ✅ ステータスページ作成可能

**設定手順:**

1. https://uptimerobot.com にアクセス
2. アカウント作成（無料）
3. 「Add New Monitor」をクリック
4. 設定:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: yaku-navi.com Backend
   URL: https://yaku-navi.com/api/health
   Monitoring Interval: 5 minutes
   ```
5. アラート設定でメールアドレスを追加

##### 2. **Pingdom**（無料プランあり）

**特徴:**
- ✅ 1分ごとに監視可能
- ✅ 複数のロケーションから監視
- ✅ 詳細なレポート

##### 3. **UptimeRobot + Webhook連携**

サイトダウン時に自動的にサーバーに通知して再起動：

```javascript
// backend/src/app.js
app.post('/webhook/restart', (req, res) => {
  const { secret } = req.body;
  
  // 秘密鍵で認証
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // PM2再起動コマンドを実行
  const { exec } = require('child_process');
  exec('pm2 restart all', (error) => {
    if (error) {
      return res.status(500).json({ error: 'Restart failed' });
    }
    res.json({ status: 'restarted' });
  });
});
```

---

### Option 3: カスタム監視スクリプト

サーバー内で定期的にプロセスをチェックするスクリプト。

#### 監視スクリプトの作成

`monitor-and-restart.sh`:

```bash
#!/bin/bash

# 監視設定
CHECK_URL="http://localhost:3001/health"
MAX_FAILURES=3
FAILURE_COUNT=0

while true; do
  echo "[$(date)] ヘルスチェック実行中..."
  
  # ヘルスチェックリクエスト
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $CHECK_URL)
  
  if [ "$HTTP_CODE" != "200" ]; then
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    echo "[$(date)] ⚠️  ヘルスチェック失敗 ($FAILURE_COUNT/$MAX_FAILURES): HTTP $HTTP_CODE"
    
    if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
      echo "[$(date)] 🚨 最大失敗回数に達しました。PM2を再起動します..."
      pm2 restart all
      FAILURE_COUNT=0
      
      # Slackに通知（オプション）
      # curl -X POST -H 'Content-type: application/json' \
      #   --data '{"text":"yaku-navi.com が自動再起動されました"}' \
      #   YOUR_SLACK_WEBHOOK_URL
    fi
  else
    echo "[$(date)] ✅ ヘルスチェック成功"
    FAILURE_COUNT=0
  fi
  
  # 60秒待機
  sleep 60
done
```

#### cronで定期実行

```bash
# cronを編集
crontab -e

# 1分ごとにチェック
* * * * * /var/www/pharmacy-platform/monitor-and-restart.sh >> /var/log/monitor.log 2>&1
```

---

### Option 4: PM2 Plus（旧Keymetrics）

PM2公式の監視サービス。

**特徴:**
- ✅ リアルタイムモニタリング
- ✅ メトリクスの可視化
- ✅ アラート機能
- ✅ リモート再起動

**料金:**
- 無料プラン: 1サーバー
- 有料プラン: $29/月〜

**設定方法:**

```bash
# PM2 Plusに登録
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# ステータス確認
pm2 web
```

公式サイト: https://pm2.io

---

### Option 5: systemdのWatchdog機能

systemdレベルでプロセスを監視。

#### systemdサービスファイルの作成

`/etc/systemd/system/pharmacy-platform.service`:

```ini
[Unit]
Description=Pharmacy Platform
After=network.target

[Service]
Type=forking
User=your-user
WorkingDirectory=/var/www/pharmacy-platform
ExecStart=/usr/local/bin/pm2 start ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 stop all
Restart=always
RestartSec=10s

# Watchdog設定
WatchdogSec=30s

[Install]
WantedBy=multi-user.target
```

#### 有効化

```bash
sudo systemctl daemon-reload
sudo systemctl enable pharmacy-platform
sudo systemctl start pharmacy-platform
```

---

## 📊 監視方法の比較

| 方法 | 難易度 | コスト | 信頼性 | PM2停止も検知 | 推奨度 |
|------|--------|--------|--------|--------------|--------|
| PM2 autorestart | ⭐ | 無料 | ⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ |
| PM2 ヘルスチェック | ⭐⭐ | 無料 | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| Uptime Robot | ⭐ | 無料 | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| カスタムスクリプト | ⭐⭐⭐ | 無料 | ⭐⭐⭐ | ❌ | ⭐⭐⭐ |
| PM2 Plus | ⭐ | 有料 | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| systemd watchdog | ⭐⭐⭐⭐ | 無料 | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |

---

## 🎯 推奨構成

### レベル1: 基本（現在の設定）

```
✅ PM2 autorestart（既に有効）
✅ メモリ制限での自動再起動
✅ 定期再起動（毎日午前4時）
```

### レベル2: 標準（+ヘルスチェック）

```
✅ レベル1の全て
+ PM2ヘルスチェック機能
+ バックエンドの /health エンドポイント
```

### レベル3: 推奨（+外部監視）

```
✅ レベル2の全て
+ Uptime Robot（無料）
+ メール通知設定
```

### レベル4: 完璧（+高度な監視）

```
✅ レベル3の全て
+ PM2 Plus（有料）
+ Slack通知
+ カスタムアラート
```

---

## 🚀 今すぐ実装できる設定

### Step 1: ヘルスチェックエンドポイントを追加（5分）

`backend/src/app.js` に追加：

```javascript
// ヘルスチェックエンドポイント
app.get('/health', async (req, res) => {
  try {
    // データベース接続チェック
    await pool.query('SELECT 1');
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});
```

### Step 2: Uptime Robotで監視設定（10分）

1. https://uptimerobot.com でアカウント作成
2. 「Add New Monitor」をクリック
3. 設定:
   - Monitor Type: **HTTP(s)**
   - URL: **https://yaku-navi.com/api/health**
   - Interval: **5 minutes**
4. アラート連絡先を追加（メールアドレス）
5. 保存

### Step 3: 動作確認（3分）

```bash
# ローカルでヘルスチェック
curl http://localhost:3001/health

# 本番環境でヘルスチェック
curl https://yaku-navi.com/api/health
```

**期待される出力:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T12:00:00.000Z",
  "uptime": 3600,
  "memory": {...},
  "database": "connected"
}
```

---

## 📋 実装チェックリスト

### 基本設定（既に完了）

- [x] PM2 autorestart有効
- [x] max_memory_restart設定
- [x] 定期再起動設定

### 推奨設定（今すぐ実装可能）

- [ ] `/health` エンドポイント追加
- [ ] Uptime Robot設定
- [ ] メール通知設定

### オプション設定

- [ ] PM2 Plus導入
- [ ] Slack通知設定
- [ ] カスタム監視スクリプト

---

## 🎊 まとめ

### 現在の状態

✅ **プロセスの停止は既に自動検知・再起動されています！**

`ecosystem.config.js` の `autorestart: true` により、PM2が常にプロセスを監視し、停止を検知すると自動的に再起動します。

### さらに強化するには

1. **ヘルスチェックエンドポイントの追加**（5分）
   - プロセスは動いているが応答していない状態を検知

2. **Uptime Robotの導入**（10分）
   - PM2自体が停止した場合も検知
   - メール通知で即座に把握

### 次のアクション

```bash
# 1. ヘルスチェックを追加
# backend/src/app.js を編集

# 2. サーバーに反映
./redeploy-yaku-navi.sh

# 3. Uptime Robotを設定
# https://uptimerobot.com
```

---

**作成者**: AI Assistant  
**作成日**: 2026年1月25日

