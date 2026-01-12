#!/bin/bash
# yaku-navi.com デプロイスクリプト
# 実行方法: bash deploy.sh

echo "========================================="
echo "yaku-navi.com デプロイスクリプト"
echo "========================================="
echo ""

# サーバー情報（XServer VPS）
SERVER="yaku-navi.com"
USER="pharmacy"
PORT="22"
PROJECT_DIR="~/pharmacy-platform"

# SSH鍵パス
SSH_KEY="${HOME}/.ssh/id_ed25519"

# 秘密鍵が存在するか確認
if [ ! -f "${SSH_KEY}" ]; then
    echo "⚠️  警告: SSH秘密鍵が見つかりません: ${SSH_KEY}"
    exit 1
fi

echo "サーバーに接続しています..."
echo "SSH鍵: ${SSH_KEY}"
echo "接続先: ${USER}@${SERVER}"
echo ""

# SSH接続してデプロイコマンドを実行
ssh -i "${SSH_KEY}" ${USER}@${SERVER} << 'EOF'
echo "========================================="
echo "Step 1: プロジェクトディレクトリに移動"
echo "========================================="
cd ~/pharmacy-platform
pwd

echo ""
echo "========================================="
echo "Step 2: 最新コードを取得"
echo "========================================="
git pull origin main

echo ""
echo "========================================="
echo "Step 3: 依存関係を更新"
echo "========================================="
npm install

echo ""
echo "========================================="
echo "Step 4: アプリケーションをビルド"
echo "========================================="
npm run build

echo ""
echo "========================================="
echo "Step 5: PM2でフロントエンドを再起動"
echo "========================================="
pm2 restart pharmacy-frontend

echo ""
echo "========================================="
echo "Step 6: デプロイ完了 - ログを確認"
echo "========================================="
pm2 logs pharmacy-frontend --lines 30 --nostream

echo ""
echo "========================================="
echo "Step 7: PM2ステータス確認"
echo "========================================="
pm2 status

echo ""
echo "✅ デプロイ完了しました！"
echo "🌐 https://yaku-navi.com/ でアクセスできます"
echo "========================================="
EOF

echo ""
echo "デプロイスクリプト実行完了"

