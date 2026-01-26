#!/bin/bash

# 日給柔軟化機能のVPSデプロイスクリプト

echo "=========================================="
echo "  日給柔軟化機能 VPSデプロイ"
echo "=========================================="
echo ""

# 色の定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

VPS_HOST="root@162.43.8.168"
VPS_PATH="/root/pharmacy-platform"

echo -e "${YELLOW}📦 デプロイするファイル:${NC}"
echo "  - backend/src/controllers/structuredMessageController.js"
echo "  - backend/src/utils/pdfGenerator.js"
echo "  - backend/src/controllers/contractController.js"
echo "  - app/pharmacy/dashboard/page.tsx"
echo "  - app/pharmacist/dashboard/page.tsx"
echo "  - lib/api/structuredMessages.ts"
echo ""

read -p "デプロイを開始しますか？ (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}キャンセルしました${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 ファイルをアップロード中...${NC}"
echo ""

# バックエンドファイルのアップロード
echo -e "${YELLOW}📤 バックエンドファイル...${NC}"
scp backend/src/controllers/structuredMessageController.js ${VPS_HOST}:${VPS_PATH}/backend/src/controllers/ && \
echo -e "${GREEN}✓ structuredMessageController.js${NC}" || \
echo -e "${RED}✗ structuredMessageController.js (失敗)${NC}"

scp backend/src/utils/pdfGenerator.js ${VPS_HOST}:${VPS_PATH}/backend/src/utils/ && \
echo -e "${GREEN}✓ pdfGenerator.js${NC}" || \
echo -e "${RED}✗ pdfGenerator.js (失敗)${NC}"

scp backend/src/controllers/contractController.js ${VPS_HOST}:${VPS_PATH}/backend/src/controllers/ && \
echo -e "${GREEN}✓ contractController.js${NC}" || \
echo -e "${RED}✗ contractController.js (失敗)${NC}"

echo ""

# フロントエンドファイルのアップロード
echo -e "${YELLOW}📤 フロントエンドファイル...${NC}"
scp app/pharmacy/dashboard/page.tsx ${VPS_HOST}:${VPS_PATH}/app/pharmacy/dashboard/ && \
echo -e "${GREEN}✓ app/pharmacy/dashboard/page.tsx${NC}" || \
echo -e "${RED}✗ app/pharmacy/dashboard/page.tsx (失敗)${NC}"

scp app/pharmacist/dashboard/page.tsx ${VPS_HOST}:${VPS_PATH}/app/pharmacist/dashboard/ && \
echo -e "${GREEN}✓ app/pharmacist/dashboard/page.tsx${NC}" || \
echo -e "${RED}✗ app/pharmacist/dashboard/page.tsx (失敗)${NC}"

scp lib/api/structuredMessages.ts ${VPS_HOST}:${VPS_PATH}/lib/api/ && \
echo -e "${GREEN}✓ lib/api/structuredMessages.ts${NC}" || \
echo -e "${RED}✗ lib/api/structuredMessages.ts (失敗)${NC}"

echo ""
echo -e "${GREEN}✓ ファイルのアップロード完了${NC}"
echo ""

# VPSでサービスを再起動
echo -e "${BLUE}🔄 VPSでサービスを再起動中...${NC}"
echo ""

ssh ${VPS_HOST} << 'ENDSSH'
cd /root/pharmacy-platform

echo "📦 バックエンドを再起動中..."
cd backend
pm2 restart pharmacy-backend
echo "✓ バックエンド再起動完了"

echo ""
echo "🎨 フロントエンドをビルド中..."
cd /root/pharmacy-platform
npm run build

echo ""
echo "🔄 フロントエンドを再起動中..."
pm2 restart pharmacy-frontend
echo "✓ フロントエンド再起動完了"

echo ""
echo "📊 PM2ステータス:"
pm2 status
ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo "  デプロイ完了！"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}📍 動作確認URL:${NC}"
echo -e "   https://yourdomain.com"
echo ""
echo -e "${YELLOW}⚠️  動作確認を行ってください:${NC}"
echo "  1. 薬局アカウントでログイン"
echo "  2. 正式オファーモーダルを開く"
echo "  3. 日給入力フィールドが表示されるか確認"
echo "  4. バリデーションが機能するか確認"
echo ""

