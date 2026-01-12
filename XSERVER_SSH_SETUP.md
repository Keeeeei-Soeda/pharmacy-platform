# XServer SSH設定ガイド

## 🔍 現在の状況確認

### 1. XServer管理画面で確認すること

XServerのSSH設定画面で、以下を確認してください：

1. **登録されている公開鍵の内容**
   - 「登録済み公開鍵」の列に表示されている鍵の内容
   - これがローカルの鍵と一致しているか確認

2. **SSH設定が有効（ON）になっているか**
   - SSH設定が「有効(ON)」になっているか確認

### 2. ローカルの公開鍵

現在のローカルの公開鍵は以下です：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINhnEbpFNtFbL4DKo8F8YLozl4mguFzUJ+zKK2Pra/Gm soedakei@soedakeinoMacBook-Air.local
```

この鍵がXServerに登録されているか確認してください。

---

## 🔧 解決方法

### パターン1: 鍵が一致している場合

XServerで登録されている鍵が上記の鍵と一致している場合、通常は接続できるはずです。

接続を試してください：
```bash
ssh pharmacy@yaku-navi.com
```

### パターン2: 鍵が一致していない場合

XServerに新しい公開鍵を登録する必要があります。

#### 手順1: 公開鍵をコピー
```bash
cat ~/.ssh/id_ed25519.pub
```

#### 手順2: XServer管理画面で登録
1. XServer管理画面の「SSH設定」にアクセス
2. 「+ 公開鍵を登録」ボタンをクリック
3. ラベルを入力（例：MacBook）
4. 公開鍵の内容を貼り付け
5. 登録

#### 手順3: 接続テスト
```bash
ssh pharmacy@yaku-navi.com
```

### パターン3: XServerから秘密鍵をダウンロードした場合

XServerのSSH設定で秘密鍵をダウンロードした場合、その鍵を使って接続できます。

```bash
# ダウンロードした秘密鍵を ~/.ssh/ に配置
# 例: ~/.ssh/xserver_key

# 鍵の権限を設定
chmod 600 ~/.ssh/xserver_key

# 接続時に鍵を指定
ssh -i ~/.ssh/xserver_key pharmacy@yaku-navi.com
```

---

## 🚀 デプロイスクリプトの修正

SSH鍵認証が設定できたら、`deploy.sh` を以下のように修正できます：

```bash
# 通常のSSH接続（鍵認証を使用）
ssh pharmacy@yaku-navi.com << 'EOF'
# デプロイコマンド...
EOF
```

または、特定の鍵を使う場合：

```bash
ssh -i ~/.ssh/xserver_key pharmacy@yaku-navi.com << 'EOF'
# デプロイコマンド...
EOF
```

---

## 📝 確認事項

- [ ] XServerのSSH設定が「有効(ON)」になっている
- [ ] 登録されている公開鍵の内容を確認した
- [ ] ローカルの公開鍵と一致しているか確認した
- [ ] 接続テストを実行した

