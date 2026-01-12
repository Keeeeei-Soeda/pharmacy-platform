# XServer SSH接続手順

## 🔑 XServerが生成した鍵を使う場合

XServerのSSH設定画面で表示されている公開鍵：
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3kvedJWsNYOiN/giCSrpOUgCeyWJEWFoFJVGjPPVE30j6EsbS37VZDKekRfqU3+i+y5yPmBuSHch1StuJf1djEK3RlZMG2V7j6B0BD+Yk5G3QhDIyjrmw9WY4uUku1l5FKRzgL7qcxmIsW2HUodKsbxxUi4T3RVzIBU7lXtsQgcwsgDvJn0xfax4l1GwNtqMMrYDnP3zZ9/oKqg/CRxehNn2ik9r1ZRL5gWH5ck2t8IC19NcESShfhojFIX4jtaUEsszYhmw4Z+UHaBR8+po1R80rqBr5WEdMbkzOmtAN1N5B6oxqawWzKnY1FE0KwAAaURXPV9Bph+YT28woj4DR xs621921@sv16713.xserver.jp
```

## 📥 手順1: 秘密鍵をダウンロード

1. XServerのSSH設定画面で、この公開鍵の行を確認
2. 「秘密鍵のダウンロード」ボタンまたはリンクをクリック
3. 秘密鍵ファイル（例：`id_rsa` または `xserver_key`）をダウンロード
4. ダウンロードしたファイルを `~/.ssh/` ディレクトリに移動

## 🔧 手順2: 秘密鍵を設定

```bash
# ダウンロードした秘密鍵を ~/.ssh/ に移動
mv ~/Downloads/xserver_key ~/.ssh/xserver_key

# 権限を設定（重要！）
chmod 600 ~/.ssh/xserver_key
```

## 🚀 手順3: SSH接続をテスト

```bash
# 秘密鍵を指定して接続
ssh -i ~/.ssh/xserver_key xs621921@sv16713.xserver.jp

# または、yaku-navi.comで接続する場合
ssh -i ~/.ssh/xserver_key pharmacy@yaku-navi.com
```

## ⚙️ 手順4: SSH設定ファイルに追加（オプション）

毎回 `-i` オプションを指定するのが面倒な場合、`~/.ssh/config` に設定を追加：

```bash
# ~/.ssh/config を編集
nano ~/.ssh/config
```

以下を追加：
```
Host yaku-navi
    HostName yaku-navi.com
    User pharmacy
    IdentityFile ~/.ssh/xserver_key
    IdentitiesOnly yes
```

これで、以下のコマンドで接続できます：
```bash
ssh yaku-navi
```

## 🔄 デプロイスクリプトの修正

`deploy.sh` を以下のように修正：

```bash
#!/bin/bash
# yaku-navi.com デプロイスクリプト

SERVER="yaku-navi.com"
USER="pharmacy"
SSH_KEY="~/.ssh/xserver_key"

ssh -i ${SSH_KEY} ${USER}@${SERVER} << 'EOF'
cd ~/pharmacy-platform
git pull origin main
npm install
npm run build
pm2 restart pharmacy-frontend
pm2 status
EOF
```

---

## 📝 注意事項

- 秘密鍵の権限は必ず `600` に設定してください
- 秘密鍵は絶対に他人に共有しないでください
- 秘密鍵をGitにコミットしないでください（`.gitignore` に追加）

