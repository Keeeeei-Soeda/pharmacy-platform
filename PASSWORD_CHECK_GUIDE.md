# 🔑 パスワード確認方法ガイド

## 📋 確認が必要なパスワード

PM2自動起動設定で必要なパスワード：
- **sudoパスワード**: `sudo`コマンド実行時に必要

---

## 🔍 パスワード確認方法

### 方法1: XServer VPS管理画面で確認（推奨）

1. **XServer VPSの管理画面にログイン**
   - https://www.xserver.ne.jp/login_vps.php
   - または、XServerのメインページから「VPS」→「ログイン」

2. **サーバー情報を確認**
   - 「サーバー情報」または「サーバー設定」を開く
   - 初期パスワードやrootパスワードが表示されている場合があります

3. **SSH設定を確認**
   - 「SSH設定」または「セキュリティ設定」を開く
   - パスワード認証の設定を確認

---

### 方法2: パスワード管理ツールやメモを確認

以下の場所を確認してください：
- パスワード管理アプリ（1Password、LastPass、Keychainなど）
- メモアプリやテキストファイル
- メール（サーバー契約時の確認メール）
- 契約書類や設定書類

---

### 方法3: パスワードなしでsudoを実行できるか確認

現在のサーバー設定では、パスワードなしでsudoが実行できる可能性があります。

#### 確認方法：

```bash
# サーバーにSSH接続（SSH鍵認証で接続できる場合）
ssh -i ~/.ssh/id_ed25519 pharmacy@yaku-navi.com

# sudoコマンドをパスワードなしで実行してみる
sudo -n echo "パスワード不要です"
```

**結果：**
- ✅ エラーが出ない → パスワード不要でsudoが実行できます
- ❌ パスワードを求められる → パスワードが必要です

---

### 方法4: パスワードをリセットする

パスワードが分からない場合、XServer VPS管理画面からリセットできます：

1. **XServer VPS管理画面にログイン**
2. **「サーバー設定」→「パスワード変更」を開く**
3. **新しいパスワードを設定**

**注意：** パスワードを変更すると、既存の接続が切れる可能性があります。

---

### 方法5: SSH鍵認証で接続して確認

現在、SSH鍵認証が設定されている場合、パスワードなしで接続できます：

```bash
# SSH鍵を使って接続
ssh -i ~/.ssh/id_ed25519 pharmacy@yaku-navi.com

# 接続後、sudo設定を確認
sudo -l
```

このコマンドで、パスワードなしでsudoが実行できるか確認できます。

---

## 🎯 PM2自動起動設定の実行方法

### パターンA: パスワード不要の場合

```bash
# サーバーにSSH接続
ssh -i ~/.ssh/id_ed25519 pharmacy@yaku-navi.com

# PM2自動起動設定
pm2 startup systemd -u pharmacy --hp /home/pharmacy

# 表示されたsudoコマンドを実行（パスワード不要）
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pharmacy --hp /home/pharmacy
```

### パターンB: パスワードが必要な場合

```bash
# サーバーにSSH接続
ssh -i ~/.ssh/id_ed25519 pharmacy@yaku-navi.com

# PM2自動起動設定
pm2 startup systemd -u pharmacy --hp /home/pharmacy

# 表示されたsudoコマンドを実行（パスワード入力が必要）
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pharmacy --hp /home/pharmacy
# [sudo] password for pharmacy: ← ここでパスワードを入力
```

---

## 💡 推奨される確認手順

1. **まず、パスワードなしでsudoが実行できるか確認**
   ```bash
   ssh -i ~/.ssh/id_ed25519 pharmacy@yaku-navi.com
   sudo -n echo "test"
   ```

2. **パスワードが必要な場合、XServer管理画面で確認**

3. **それでも分からない場合、パスワードをリセット**

---

## ⚠️ 注意事項

- パスワードはセキュリティ上重要な情報です。他人に共有しないでください
- パスワードを変更した場合は、安全な場所に記録してください
- SSH鍵認証が設定されている場合、パスワード認証は無効化されている可能性があります

---

## 🔐 セキュリティのベストプラクティス

1. **SSH鍵認証を使用**（現在設定済み）
2. **パスワード認証を無効化**（推奨）
3. **強力なパスワードを使用**（8文字以上、大文字・小文字・数字・記号を含む）
4. **定期的にパスワードを変更**

