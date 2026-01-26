#!/bin/bash

# yaku-navi.com 簡易再デプロイスクリプト
# 実行方法: ./redeploy-yaku-navi.sh

set -e

echo "🚀 yaku-navi.com 再デプロイスクリプト"
echo "======================================"
echo ""

# サーバー情報（編集してください）
SERVER_USER="ユーザー名"
SERVER_HOST="yaku-navi.com"
SERVER_PATH="/var/www/pharmacy-platform"

echo "📋 設定情報:"
echo "  サーバー: $SERVER_HOST"
echo "  ユーザー: $SERVER_USER"
echo "  パス: $SERVER_PATH"
echo ""

read -p "この設定で続行しますか？ (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ キャンセルしました"
    exit 1
fi

echo ""
echo "Step 1: ファイルをアップロード中..."
echo "======================================"

# ecosystem.config.js をアップロード
echo "📤 ecosystem.config.js をアップロード..."
scp ecosystem.config.js $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# バックエンドをアップロード
echo "📤 バックエンドをアップロード..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
  backend/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/

# フロントエンドの設定ファイルをアップロード
echo "📤 フロントエンド設定をアップロード..."
scp package.json $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
scp next.config.ts $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

echo "✅ アップロード完了"
echo ""

echo "Step 2: サーバー上でPM2を再起動..."
echo "======================================"

ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /var/www/pharmacy-platform

echo "🔄 PM2プロセスを停止..."
pm2 stop all

echo "🗑️  PM2プロセスを削除..."
pm2 delete all

echo "📦 バックエンドの依存関係をインストール..."
cd backend
npm install --production

echo "🚀 PM2で起動..."
cd ..
pm2 start ecosystem.config.js

echo "💾 PM2設定を保存..."
pm2 save

echo "📊 PM2ステータス確認..."
pm2 status

echo ""
echo "✅ 再デプロイ完了！"
EOF

echo ""
echo "======================================"
echo "🎉 再デプロイが完了しました！"
echo "======================================"
echo ""
echo "📍 確認URL:"
echo "  - https://yaku-navi.com"
echo "  - https://yaku-navi.com/invoice-issued"
echo ""
echo "💡 サーバーログの確認:"
echo "  ssh $SERVER_USER@$SERVER_HOST"
echo "  pm2 logs"
echo ""

