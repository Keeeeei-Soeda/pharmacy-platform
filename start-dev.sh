#!/bin/bash

echo "🚀 薬剤師マッチングプラットフォーム - 開発環境起動スクリプト"
echo "=================================================="
echo ""

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 現在のディレクトリ確認
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ エラー: プロジェクトルートで実行してください${NC}"
    exit 1
fi

# ポート使用状況チェック
echo -e "${BLUE}🔍 ポート使用状況を確認中...${NC}"
echo ""

# ポート3001のチェック（バックエンド）
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  ポート3001は使用中です（バックエンド）${NC}"
    echo "   既存のプロセスをそのまま使用します"
else
    echo -e "${GREEN}✅ ポート3001は利用可能です（バックエンド）${NC}"
fi

# ポート3005のチェック（フロントエンド）
if lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  ポート3005は使用中です（フロントエンド）${NC}"
    echo "   既存のプロセスを停止します..."
    lsof -ti:3005 | xargs kill -9 2>/dev/null
    sleep 2
fi
echo -e "${GREEN}✅ ポート3005は利用可能です（フロントエンド）${NC}"

echo ""
echo -e "${BLUE}📦 依存関係を確認中...${NC}"

# node_modulesの存在確認
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modulesが見つかりません。インストールします...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  backend/node_modulesが見つかりません。インストールします...${NC}"
    cd backend && npm install && cd ..
fi

echo -e "${GREEN}✅ 依存関係の確認完了${NC}"
echo ""

# バックエンド起動
echo -e "${BLUE}🔧 バックエンドを起動中...${NC}"
cd backend
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ バックエンド起動完了 (PID: $BACKEND_PID)${NC}"
    echo "   ログ: backend.log"
else
    echo -e "${GREEN}✅ バックエンドは既に起動しています${NC}"
fi
cd ..

# 少し待機
sleep 2

# フロントエンド起動
echo ""
echo -e "${BLUE}🎨 フロントエンドを起動中...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ フロントエンド起動完了 (PID: $FRONTEND_PID)${NC}"
echo "   ログ: frontend.log"

# 起動待機
echo ""
echo -e "${YELLOW}⏳ サーバーが起動するまで待機中...${NC}"
sleep 5

# 起動確認
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 起動完了！${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📍 アクセスURL:${NC}"
echo ""
echo -e "  🏥 ${GREEN}薬局ダッシュボード:${NC}"
echo -e "     ${BLUE}http://localhost:3005/pharmacy/dashboard${NC}"
echo ""
echo -e "  💊 ${GREEN}薬剤師ダッシュボード:${NC}"
echo -e "     ${BLUE}http://localhost:3005/pharmacist/dashboard${NC}"
echo ""
echo -e "  📄 ${GREEN}請求書プレビュー:${NC}"
echo -e "     ${BLUE}http://localhost:3005/preview/invoice${NC}"
echo ""
echo -e "  📋 ${GREEN}労働条件通知書プレビュー:${NC}"
echo -e "     ${BLUE}http://localhost:3005/preview/work-notice${NC}"
echo ""
echo -e "  🔧 ${GREEN}バックエンドAPI:${NC}"
echo -e "     ${BLUE}http://localhost:3001${NC}"
echo ""
echo "=================================================="
echo ""
echo -e "${YELLOW}💡 ヒント:${NC}"
echo "  • ログを確認: tail -f frontend.log または tail -f backend.log"
echo "  • 停止: ./stop-dev.sh を実行"
echo "  • ポート3000は別サイトで使用されているため、3005を使用しています"
echo ""
echo -e "${GREEN}✨ 開発を楽しんでください！${NC}"
echo ""

