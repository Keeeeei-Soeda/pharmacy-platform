# 🔑 SSH鍵認証の確認と設定ガイド

**作成日**: 2026年1月25日

---

## 📋 現在の状況

VPSパネルでSSH Keyが既に登録されています：
- **SSH Key名**: `yakunavi`
- **公開鍵タイプ**: Ed25519
- **公開鍵**: `ssh-ed25519 AAAAC3NzaC1IZDI1NTE5AAAAINhnEbpFNtFbL4DK08F8YLozl4mguF zUJ+zKK2Pra/Gm soedakei@soedakeinoMacBook-Air.local`

---

## ✅ SSH接続の確認方法

### Step 1: ローカルマシンに秘密鍵があるか確認

```bash
# 秘密鍵を探す
ls -la ~/.ssh/

# 一般的な秘密鍵ファイル名
# - id_ed25519 (Ed25519形式)
# - id_rsa (RSA形式)
# - id_ecdsa (ECDSA形式)
```

### Step 2: 秘密鍵が存在する場合

```bash
# SSH鍵認証で接続（パスワード不要）
ssh root@yaku-navi.com
# または
ssh root@162.43.8.168
```

**接続成功の確認:**
- パスワードを求められない
- サーバーのプロンプトが表示される
- `Welcome to Ubuntu...` などのメッセージが表示される

### Step 3: 秘密鍵が存在しない場合

#### オプションA: 新しいSSH鍵ペアを生成

```bash
# Ed25519形式で新しい鍵ペアを生成
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519_yakunavi

# 公開鍵を表示
cat ~/.ssh/id_ed25519_yakunavi.pub

# この公開鍵をVPSパネルに登録
```

#### オプションB: パスワード認証を使用

```bash
# パスワード認証で接続
ssh root@yaku-navi.com

# パスワードを求められたら、VPSパネルで確認したrootパスワードを入力
```

---

## 🔍 SSH接続の詳細確認

### 接続テスト（詳細モード）

```bash
# 詳細な接続ログを表示
ssh -v root@yaku-navi.com
```

**確認ポイント:**
- `Authentications that can continue: publickey` → SSH鍵認証が使用される
- `Offering public key: /Users/.../.ssh/id_ed25519` → 秘密鍵が見つかった
- `Authentication succeeded` → 認証成功

### 接続エラーの場合

#### エラー1: `Permission denied (publickey)`

**原因**: 秘密鍵が見つからない、または公開鍵がサーバーに登録されていない

**解決策:**
```bash
# 1. 秘密鍵のパスを指定
ssh -i ~/.ssh/id_ed25519 root@yaku-navi.com

# 2. または、新しい鍵ペアを生成してVPSパネルに登録
```

#### エラー2: `Host key verification failed`

**原因**: サーバーのホストキーが変更された（OS再インストール後によく発生）

**解決策:**
```bash
# 既存のホストキーを削除
ssh-keygen -R yaku-navi.com
ssh-keygen -R 162.43.8.168

# 再度接続
ssh root@yaku-navi.com
```

---

## 📝 SSH設定ファイルの設定（オプション）

接続を簡単にするために、`~/.ssh/config` を設定できます：

```bash
# SSH設定ファイルを編集
nano ~/.ssh/config
```

**設定内容:**
```
Host yaku-navi
    HostName yaku-navi.com
    User root
    IdentityFile ~/.ssh/id_ed25519
    Port 22
```

**使用例:**
```bash
# 設定後は、短いコマンドで接続可能
ssh yaku-navi
```

---

## 🎯 現在のSSH Keyの確認

### VPSパネルで確認

1. VPSパネルにログイン
2. 「SSH Key」メニューを開く
3. 登録されているSSH Keyを確認
   - **名前**: `yakunavi`
   - **公開鍵**: Ed25519形式

### ローカルマシンで確認

```bash
# 公開鍵を表示（秘密鍵から）
ssh-keygen -y -f ~/.ssh/id_ed25519

# 表示された公開鍵が、VPSパネルに登録されている公開鍵と一致するか確認
```

---

## ✅ 接続確認チェックリスト

### 接続前

- [ ] VPSパネルでSSH Keyが登録されている（✅ 確認済み: `yakunavi`）
- [ ] ローカルマシンに秘密鍵が存在する
- [ ] 秘密鍵のパーミッションが正しい（`chmod 600 ~/.ssh/id_ed25519`）

### 接続時

- [ ] `ssh root@yaku-navi.com` で接続できる
- [ ] パスワードを求められない（SSH鍵認証が機能している）
- [ ] サーバーのプロンプトが表示される

### 接続後

- [ ] コマンドが正常に実行できる
- [ ] ファイルのアップロード/ダウンロードができる

---

## 🚀 次のステップ

### SSH接続が成功したら

1. **OS_REINSTALL_SETUP.md** の手順に従ってセットアップを続行
2. Step 3-2以降（システムの更新）から開始

### 接続できない場合

1. 秘密鍵の存在を確認
2. VPSパネルでSSH Keyが正しく登録されているか確認
3. パスワード認証で接続を試す
4. VPSパネルのサポートに問い合わせ

---

## 📊 まとめ

### 現在の状況

✅ **VPSパネルにSSH Keyが登録されています**
- SSH Key名: `yakunavi`
- 公開鍵タイプ: Ed25519

### 接続方法

```bash
# SSH鍵認証で接続（推奨）
ssh root@yaku-navi.com

# または
ssh root@162.43.8.168
```

### 確認事項

1. ローカルマシンに秘密鍵が存在するか
2. 秘密鍵のパーミッションが正しいか（`chmod 600`）
3. 接続が成功するか

---

**作成者**: AI Assistant  
**作成日**: 2026年1月25日

