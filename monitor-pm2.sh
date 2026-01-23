#!/bin/bash
# PM2監視スクリプト
# PM2プロセスが停止していないか定期的にチェックし、停止していたら再起動します

echo "========================================="
echo "PM2監視スクリプト"
echo "========================================="
echo ""

# サーバー情報
SERVER="yaku-navi.com"
USER="pharmacy"
SSH_KEY="${HOME}/.ssh/id_ed25519"

echo "サーバーに接続してPM2プロセスを監視します..."
echo "接続先: ${USER}@${SERVER}"
echo ""

# SSH接続してPM2監視を実行
ssh -i "${SSH_KEY}" ${USER}@${SERVER} << 'EOF'
cd ~/pharmacy-platform

echo "========================================="
echo "PM2プロセス状態を確認"
echo "========================================="
pm2 status

echo ""
echo "========================================="
echo "停止しているプロセスをチェック"
echo "========================================="

# フロントエンドの状態を確認
FRONTEND_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="pharmacy-frontend") | .pm2_env.status' 2>/dev/null)
BACKEND_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="pharmacy-backend") | .pm2_env.status' 2>/dev/null)

if [ "$FRONTEND_STATUS" != "online" ]; then
    echo "⚠️  フロントエンドが停止しています。再起動します..."
    pm2 restart pharmacy-frontend
    sleep 2
fi

if [ "$BACKEND_STATUS" != "online" ]; then
    echo "⚠️  バックエンドが停止しています。再起動します..."
    pm2 restart pharmacy-backend
    sleep 2
fi

# jqがインストールされていない場合の代替方法
if ! command -v jq &> /dev/null; then
    echo ""
    echo "jqがインストールされていないため、簡易チェックを実行します..."
    
    # PM2リストから直接確認
    if ! pm2 list | grep -q "pharmacy-frontend.*online"; then
        echo "⚠️  フロントエンドが停止しています。再起動します..."
        pm2 restart pharmacy-frontend || pm2 start ecosystem.config.js --only pharmacy-frontend
    fi
    
    if ! pm2 list | grep -q "pharmacy-backend.*online"; then
        echo "⚠️  バックエンドが停止しています。再起動します..."
        pm2 restart pharmacy-backend || pm2 start ecosystem.config.js --only pharmacy-backend
    fi
fi

echo ""
echo "========================================="
echo "最終状態確認"
echo "========================================="
pm2 status

echo ""
echo "========================================="
echo "監視完了"
echo "========================================="
EOF

echo ""
echo "監視スクリプト実行完了"

