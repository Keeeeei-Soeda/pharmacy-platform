#!/bin/bash
# PM2自動起動設定スクリプト
# サーバー再起動時にPM2プロセスを自動起動するように設定します

echo "========================================="
echo "PM2自動起動設定スクリプト"
echo "========================================="
echo ""

# サーバー情報
SERVER="yaku-navi.com"
USER="pharmacy"
SSH_KEY="${HOME}/.ssh/id_ed25519"

echo "サーバーに接続してPM2自動起動を設定します..."
echo "接続先: ${USER}@${SERVER}"
echo ""

# SSH接続してPM2自動起動設定を実行
ssh -i "${SSH_KEY}" ${USER}@${SERVER} << 'EOF'
echo "========================================="
echo "Step 1: PM2の現在のプロセスを保存"
echo "========================================="
cd ~/pharmacy-platform
pm2 save

echo ""
echo "========================================="
echo "Step 2: PM2自動起動設定を生成"
echo "========================================="
STARTUP_CMD=$(pm2 startup systemd -u pharmacy --hp /home/pharmacy | grep "sudo")

if [ -n "$STARTUP_CMD" ]; then
    echo "以下のコマンドを実行する必要があります:"
    echo "$STARTUP_CMD"
    echo ""
    echo "⚠️  注意: このコマンドはsudo権限が必要です"
    echo "サーバーに直接SSH接続して実行してください:"
    echo "ssh pharmacy@yaku-navi.com"
    echo "そして上記のコマンドを実行"
else
    echo "✅ PM2自動起動は既に設定済みです"
fi

echo ""
echo "========================================="
echo "Step 3: 現在のPM2ステータス確認"
echo "========================================="
pm2 status

echo ""
echo "========================================="
echo "設定完了"
echo "========================================="
EOF

echo ""
echo "スクリプト実行完了"
echo ""
echo "⚠️  重要: PM2自動起動を有効にするには、"
echo "サーバーにSSH接続して、表示されたsudoコマンドを実行してください"

