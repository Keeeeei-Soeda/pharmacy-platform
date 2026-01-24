# PM2自動起動設定 - 完了手順

## 📋 これまでの流れ

1. ✅ サーバー情報を確認（VPSパネル）
2. ✅ SSH接続成功（`pharmacy@yaku-navi.com`）
3. ✅ PM2自動起動設定コマンドを生成
4. ⚠️ sudoパスワードが間違っていた（3回失敗）

## 🔑 確認したパスワード情報

- **sudoパスワード**: `Yakunavi168`

---

## 🚀 実行手順（再実行）

### ステップ1: SSH接続

```bash
ssh pharmacy@yaku-navi.com
```

または、SSH鍵を使用：

```bash
ssh -i ~/.ssh/id_ed25519 pharmacy@yaku-navi.com
```

### ステップ2: PM2の現在のプロセスを保存

```bash
cd ~/pharmacy-platform
pm2 save
```

### ステップ3: PM2自動起動設定を生成

```bash
pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

**表示されるメッセージ：**
```
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

### ステップ4: sudoコマンドを実行（重要）

表示されたコマンドをコピーして実行：

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

**パスワード入力時：**
- `[sudo] password for pharmacy:` と表示されたら
- **`Yakunavi168`** を入力（画面には表示されませんが、入力されています）
- Enterキーを押す

**成功すると以下のメッセージが表示されます：**
```
[PM2] Startup Script successfully created
```

---

## ✅ 設定完了の確認

### 確認方法1: PM2ステータス確認

```bash
pm2 status
```

両方のプロセスが `online` になっていることを確認：
- pharmacy-backend: online
- pharmacy-frontend: online

### 確認方法2: 自動起動設定の確認

```bash
sudo systemctl status pm2-pharmacy
```

または

```bash
sudo systemctl is-enabled pm2-pharmacy
```

`enabled` と表示されれば設定完了です。

---

## 🔄 サーバー再起動テスト（オプション）

設定が完了したら、サーバー再起動時に自動起動するかテストできます：

```bash
# サーバーを再起動（VPSパネルから実行）
# 再起動後、以下で確認
ssh pharmacy@yaku-navi.com
pm2 status
```

両方のプロセスが自動的に起動していれば成功です。

---

## ⚠️ 注意事項

1. **パスワード入力時**
   - パスワードは画面に表示されません（セキュリティのため）
   - 正しく入力していれば、Enterキーを押すと処理が進みます

2. **接続が閉じられた場合**
   - 3回パスワードを間違えると接続が閉じられます
   - 再度SSH接続してから実行してください

3. **パスワードが正しくない場合**
   - VPSパネル → アカウント → パスワード変更で確認
   - または、パスワードをリセット

---

## 📝 実行ログ（参考）

```
pharmacy@x162-43-8-168:~$ pm2 startup systemd -u pharmacy --hp /home/pharmacy
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy

pharmacy@x162-43-8-168:~$ sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pharmacy --hp /home/pharmacy
[sudo] password for pharmacy: Yakunavi168 ← ここで入力（表示されない）
[PM2] Startup Script successfully created ← 成功メッセージ
```

---

**最終更新**: 2026年1月25日

