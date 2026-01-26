# ✅ yaku-navi.com 502エラー対応完了

**作成日**: 2026年1月25日

---

## 🎯 実施内容

### 1. **PM2自動再起動設定の強化**
`ecosystem.config.js` を更新しました。

#### 強化された機能

| 機能 | 設定値 | 効果 |
|------|--------|------|
| 最大再起動回数 | 10 → **15回** | より多くの再試行 |
| 再起動遅延 | 4000ms → **5000ms** | 安定性向上 |
| 指数バックオフ | **100ms** | 段階的な再起動間隔 |
| 定期再起動 | **毎日午前4時** | メモリリーク対策 |
| プロセス終了タイムアウト | **5000ms** | グレースフルシャットダウン |

### 2. **完全再デプロイ手順書の作成**
`REDEPLOY_YAKU_NAVI.md` を作成しました。

**内容:**
- ✅ ステップバイステップの詳細手順
- ✅ トラブルシューティングガイド
- ✅ 動作確認チェックリスト
- ✅ PM2コマンド早見表

### 3. **自動デプロイスクリプトの作成**
`redeploy-yaku-navi.sh` を作成しました。

**機能:**
- ✅ ワンコマンドで再デプロイ
- ✅ ファイルの自動アップロード
- ✅ PM2の自動再起動
- ✅ 実行結果の表示

---

## 🚀 再デプロイ方法（2つの選択肢）

### 方法A: 自動スクリプトで実行（推奨・10分）

#### 1. スクリプトを編集

```bash
vim redeploy-yaku-navi.sh
```

以下の部分を編集：
```bash
SERVER_USER="あなたのユーザー名"
SERVER_HOST="yaku-navi.com"
SERVER_PATH="/var/www/pharmacy-platform"
```

#### 2. スクリプトを実行

```bash
./redeploy-yaku-navi.sh
```

#### 3. 確認

https://yaku-navi.com にアクセスして確認

---

### 方法B: 手動で実行（詳細・30-40分）

`REDEPLOY_YAKU_NAVI.md` の手順に従って実行してください。

#### 主な手順

1. **ファイルをアップロード**
   ```bash
   scp ecosystem.config.js ユーザー名@yaku-navi.com:/var/www/pharmacy-platform/
   ```

2. **SSH接続**
   ```bash
   ssh ユーザー名@yaku-navi.com
   ```

3. **PM2を再起動**
   ```bash
   cd /var/www/pharmacy-platform
   pm2 stop all
   pm2 delete all
   pm2 start ecosystem.config.js
   pm2 save
   ```

4. **動作確認**
   ```bash
   pm2 status
   ```

---

## 📋 再デプロイで解決される問題

### ✅ 502エラーの解消

**原因:**
- PM2プロセスが停止
- メモリ不足で強制終了
- 予期しないクラッシュ

**解決策:**
- PM2プロセスの完全リセット
- 新しい設定での再起動
- 自動再起動の強化

### ✅ 頻繁な停止の防止

**新機能:**
- **自動再起動回数を増加**（10回 → 15回）
- **指数バックオフ再起動**（段階的に間隔を延ばす）
- **メモリ制限での自動再起動**（500M/1G超過時）
- **定期的な予防再起動**（毎日午前4時）

### ✅ サーバー再起動時の自動復旧

**設定:**
- systemd起動スクリプトの設定
- `pm2 startup` による自動起動
- `pm2 save` による状態保存

---

## 🎯 期待される効果

### 即座の効果

1. **502エラーの解消**
   - プロセスが正常に起動
   - yaku-navi.comにアクセス可能

2. **安定性の向上**
   - 自動再起動の強化
   - メモリ管理の改善

### 中長期的な効果

1. **ダウンタイムの削減**
   - 自動再起動により即座に復旧
   - 人的介入が不要

2. **メンテナンス負荷の軽減**
   - 定期的な自動再起動
   - メモリリークの予防

3. **信頼性の向上**
   - サーバー再起動後も自動復旧
   - より堅牢なシステム

---

## 📊 新しいPM2設定の詳細

### ecosystem.config.js の主な変更点

#### バックエンド（pharmacy-backend）

```javascript
{
  max_restarts: 15,                     // 10 → 15
  restart_delay: 5000,                  // 4000 → 5000
  exp_backoff_restart_delay: 100,      // 新規追加
  kill_timeout: 5000,                   // 新規追加
  wait_ready: true,                     // 新規追加
  listen_timeout: 10000,                // 新規追加
  cron_restart: "0 4 * * *",           // 新規追加（毎日午前4時）
}
```

#### フロントエンド（pharmacy-frontend）

```javascript
{
  max_restarts: 15,                     // 10 → 15
  restart_delay: 5000,                  // 4000 → 5000
  exp_backoff_restart_delay: 100,      // 新規追加
  kill_timeout: 5000,                   // 新規追加
  listen_timeout: 10000,                // 新規追加
  cron_restart: "5 4 * * *",           // 新規追加（毎日午前4時5分）
}
```

---

## 🔍 動作確認方法

### Step 1: プロセス確認

```bash
ssh ユーザー名@yaku-navi.com
pm2 status
```

**期待される出力:**
```
┌─────┬───────────────────────┬─────────┬─────────┬──────┬────────┐
│ id  │ name                  │ version │ mode    │ pid  │ status │
├─────┼───────────────────────┼─────────┼─────────┼──────┼────────┤
│ 0   │ pharmacy-backend      │ N/A     │ fork    │ XXXX │ online │
│ 1   │ pharmacy-frontend     │ N/A     │ fork    │ XXXX │ online │
└─────┴───────────────────────┴─────────┴─────────┴──────┴────────┘
```

### Step 2: ブラウザ確認

1. https://yaku-navi.com
2. https://yaku-navi.com/invoice-issued
3. https://yaku-navi.com/auth/login

### Step 3: ログ確認

```bash
pm2 logs --lines 50
```

エラーがないことを確認

---

## 🚨 トラブルシューティング

### 再デプロイ後も502エラーが続く場合

#### 1. PM2プロセスを確認

```bash
ssh ユーザー名@yaku-navi.com
pm2 status
```

- `online` になっているか？
- `errored` または `stopped` になっていないか？

#### 2. ログを確認

```bash
pm2 logs pharmacy-backend --err --lines 50
```

エラーメッセージを確認

#### 3. ポートを確認

```bash
netstat -tuln | grep -E '3000|3001'
```

ポートがLISTEN状態か確認

#### 4. Nginxを確認

```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. 依存関係を再インストール

```bash
cd /var/www/pharmacy-platform/backend
rm -rf node_modules
npm install --production
pm2 restart pharmacy-backend
```

---

## 📝 チェックリスト

### 再デプロイ前

- [ ] ローカルコードをコミット
- [ ] ecosystem.config.js が最新
- [ ] redeploy-yaku-navi.sh のサーバー情報を編集

### 再デプロイ中

- [ ] ファイルのアップロード完了
- [ ] SSH接続成功
- [ ] PM2プロセス削除完了
- [ ] PM2新規起動完了
- [ ] pm2 save 完了

### 再デプロイ後（即座）

- [ ] pm2 status で `online` 確認
- [ ] ポート3000/3001が LISTEN 状態
- [ ] https://yaku-navi.com にアクセス可能
- [ ] エラーログなし

### 再デプロイ後（5分後）

- [ ] プロセスが `online` のまま
- [ ] restart カウントが増えていない
- [ ] メモリ使用量が正常範囲内

### 翌日確認

- [ ] 午前4時の定期再起動が実行された
- [ ] 再起動後も正常動作

---

## 📚 作成したファイル

1. **`ecosystem.config.js`** - PM2設定ファイル（更新）
2. **`REDEPLOY_YAKU_NAVI.md`** - 詳細再デプロイ手順書
3. **`redeploy-yaku-navi.sh`** - 自動再デプロイスクリプト
4. **`YAKU_NAVI_REDEPLOY_SUMMARY.md`** - このファイル（まとめ）

---

## 🎊 まとめ

### 実施すること

1. **`redeploy-yaku-navi.sh` のサーバー情報を編集**
2. **スクリプトを実行: `./redeploy-yaku-navi.sh`**
3. **https://yaku-navi.com で動作確認**

### 期待される結果

- ✅ 502エラーが解消される
- ✅ PM2自動再起動が強化される
- ✅ より安定したサービス運用が可能になる
- ✅ 毎日自動でメンテナンスされる

---

**次のアクション**: 

```bash
# サーバー情報を編集
vim redeploy-yaku-navi.sh

# 実行
./redeploy-yaku-navi.sh
```

準備完了です！🚀

---

**作成者**: AI Assistant  
**作成日**: 2026年1月25日

