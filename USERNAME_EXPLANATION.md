# 🔑 「ユーザー名」についての説明

**作成日**: 2026年1月25日

---

## 📋 質問への回答

### Q: ユーザー名はどこの部分を指していますか？

### A: **VPSサーバーにSSH接続する際のサーバー側のユーザー名です**

---

## 🔍 具体的な説明

### 「ユーザー名」とは

ドキュメント内で「ユーザー名」と記載している部分は、以下のコマンドで使用するユーザー名を指します：

```bash
ssh ユーザー名@yaku-navi.com
# または
ssh ユーザー名@162.43.8.168
```

### OS再インストール後の場合

**通常は `root` ユーザーです**

```bash
# 例
ssh root@yaku-navi.com
ssh root@162.43.8.168
```

---

## 📊 ユーザー名の確認方法

### 方法1: VPSパネルで確認

1. VPSパネルにログイン
2. 「SSH接続情報」または「サーバー情報」を確認
3. ユーザー名が表示されます

### 方法2: 既存のSSH接続設定で確認

```bash
# ~/.ssh/config を確認
cat ~/.ssh/config

# または既存の接続コマンドを確認
# 例: ssh root@yaku-navi.com の場合、ユーザー名は "root"
```

### 方法3: サーバー提供元の情報で確認

- 初期設定メール
- サーバー管理画面
- ドキュメント

---

## 🎯 一般的なパターン

### パターン1: OS再インストール直後

```bash
# ユーザー名: root
ssh root@yaku-navi.com
```

**理由**: OS再インストール後は、デフォルトでrootユーザーが有効になっています。

### パターン2: 一般ユーザーを作成した後

```bash
# ユーザー名: 作成したユーザー名（例: ubuntu, admin, pharmacy など）
ssh ubuntu@yaku-navi.com
```

**理由**: セキュリティのため、一般ユーザーを作成して使用する場合があります。

### パターン3: 既存のサーバー

```bash
# ユーザー名: 既存の設定による（root または作成済みユーザー）
ssh 既存のユーザー名@yaku-navi.com
```

---

## 📝 ドキュメント内での表記

### 現在の表記

```bash
ssh ユーザー名@yaku-navi.com
scp file.txt ユーザー名@yaku-navi.com:/path/
rsync ... ユーザー名@yaku-navi.com:/path/
```

### 実際の使用例（OS再インストール後）

```bash
# rootユーザーの場合
ssh root@yaku-navi.com
scp file.txt root@yaku-navi.com:/path/
rsync ... root@yaku-navi.com:/path/
```

---

## 🔧 スクリプトでの設定

### backup-before-reinstall.sh

```bash
# スクリプト内で編集する部分
SERVER_USER="root"  # ← ここにユーザー名を入力
```

### redeploy-yaku-navi.sh

```bash
# スクリプト内で編集する部分
SERVER_USER="root"  # ← ここにユーザー名を入力
```

---

## ⚠️ 注意事項

### パスワード認証の場合

```bash
ssh root@yaku-navi.com
# パスワードを求められたら、VPSパネルで確認したパスワードを入力
```

### SSH鍵認証の場合

```bash
# SSH鍵が設定されている場合、パスワードは不要
ssh -i ~/.ssh/your_key root@yaku-navi.com
```

### 初回接続時

```bash
# 初回接続時は以下のメッセージが表示されます
# Are you sure you want to continue connecting (yes/no)?
# → yes と入力
```

---

## 🎯 まとめ

### 「ユーザー名」とは

✅ **VPSサーバーにSSH接続する際のサーバー側のユーザー名**

### OS再インストール後は

✅ **通常 `root` ユーザー**

### 確認方法

1. VPSパネルの「SSH接続情報」を確認
2. 既存のSSH接続設定を確認
3. サーバー提供元の情報を確認

### 使用例

```bash
# OS再インストール後の場合（通常は root）
ssh root@yaku-navi.com
ssh root@162.43.8.168
```

---

**作成者**: AI Assistant  
**作成日**: 2026年1月25日

