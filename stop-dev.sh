#!/bin/bash

echo "🛑 薬剤師マッチングプラットフォーム - 停止スクリプト"
echo "=================================================="
echo ""

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ポート3005のプロセスを停止（フロントエンド）
if lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${BLUE}🎨 フロントエンドを停止中...${NC}"
    lsof -ti:3005 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ フロントエンド停止完了${NC}"
else
    echo -e "${YELLOW}⚠️  フロントエンドは起動していません${NC}"
fi

# ポート3001のプロセスを停止（バックエンド）
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${BLUE}🔧 バックエンドを停止中...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ バックエンド停止完了${NC}"
else
    echo -e "${YELLOW}⚠️  バックエンドは起動していません${NC}"
fi

# ログファイルの確認
if [ -f "frontend.log" ] || [ -f "backend.log" ]; then
    echo ""
    read -p "ログファイルを削除しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f frontend.log backend.log
        echo -e "${GREEN}✅ ログファイルを削除しました${NC}"
    fi
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 停止完了${NC}"
echo "=================================================="
echo ""

