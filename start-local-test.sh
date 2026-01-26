#!/bin/bash

# ローカルテスト起動スクリプト
# 日給柔軟化機能のテスト用

echo "=========================================="
echo "  薬剤師マッチングプラットフォーム"
echo "  ローカルテスト環境 起動"
echo "=========================================="
echo ""

# 色の定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 現在のディレクトリを確認
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}📍 プロジェクトディレクトリ: ${NC}$SCRIPT_DIR"
echo ""

# 環境変数ファイルの確認
echo -e "${YELLOW}🔍 環境変数ファイルの確認...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local が見つかりません${NC}"
    echo -e "${YELLOW}作成しています...${NC}"
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✓ .env.local を作成しました${NC}"
else
    echo -e "${GREEN}✓ .env.local が存在します${NC}"
fi

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env が見つかりません${NC}"
    echo -e "${YELLOW}⚠️  backend/.env を手動で作成してください${NC}"
    echo ""
    echo "必要な内容:"
    echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/pharmacy_platform\""
    echo "JWT_SECRET=\"your-secret-key\""
    echo "PORT=3001"
    echo ""
    exit 1
else
    echo -e "${GREEN}✓ backend/.env が存在します${NC}"
fi

echo ""

# ポートの確認
echo -e "${YELLOW}🔍 ポートの使用状況を確認...${NC}"

# ポート3001の確認
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}❌ ポート3001は既に使用されています${NC}"
    echo -e "${YELLOW}使用中のプロセス:${NC}"
    lsof -i :3001
    echo ""
    read -p "このプロセスを終了しますか？ (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -ti :3001)
        kill -9 $PID
        echo -e "${GREEN}✓ プロセスを終了しました${NC}"
    else
        echo -e "${RED}別のポートを使用するか、手動でプロセスを終了してください${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ ポート3001は使用可能です${NC}"
fi

# ポート3006の確認
if lsof -Pi :3006 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}❌ ポート3006は既に使用されています${NC}"
    echo -e "${YELLOW}使用中のプロセス:${NC}"
    lsof -i :3006
    echo ""
    read -p "このプロセスを終了しますか？ (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -ti :3006)
        kill -9 $PID
        echo -e "${GREEN}✓ プロセスを終了しました${NC}"
    else
        echo -e "${RED}別のポートを使用するか、手動でプロセスを終了してください${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ ポート3006は使用可能です${NC}"
fi

echo ""

# データベースの確認
echo -e "${YELLOW}🔍 PostgreSQLの起動確認...${NC}"
if pg_isready >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQLは起動しています${NC}"
else
    echo -e "${RED}❌ PostgreSQLが起動していません${NC}"
    echo -e "${YELLOW}PostgreSQLを起動してください:${NC}"
    echo "  brew services start postgresql"
    echo "  または"
    echo "  pg_ctl -D /usr/local/var/postgres start"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  すべての準備が完了しました！"
echo "==========================================${NC}"
echo ""

# 起動オプションの選択
echo "起動方法を選択してください:"
echo "  1) バックエンドとフロントエンドを同時起動（推奨）"
echo "  2) バックエンドのみ起動"
echo "  3) フロントエンドのみ起動"
echo "  4) キャンセル"
echo ""
read -p "選択 (1-4): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo -e "${BLUE}🚀 バックエンドとフロントエンドを起動します...${NC}"
        echo ""
        
        # バックエンドをバックグラウンドで起動
        echo -e "${YELLOW}📦 バックエンドを起動中...${NC}"
        cd backend
        npm run dev > ../backend.log 2>&1 &
        BACKEND_PID=$!
        cd ..
        echo -e "${GREEN}✓ バックエンド起動 (PID: $BACKEND_PID, Port: 3001)${NC}"
        echo -e "${BLUE}   ログ: backend.log${NC}"
        
        # 少し待つ
        sleep 3
        
        # フロントエンドを起動
        echo ""
        echo -e "${YELLOW}🎨 フロントエンドを起動中...${NC}"
        echo -e "${GREEN}✓ フロントエンド起動 (Port: 3006)${NC}"
        echo ""
        echo -e "${GREEN}=========================================="
        echo "  起動完了！"
        echo "==========================================${NC}"
        echo ""
        echo -e "${BLUE}📍 アクセスURL:${NC}"
        echo -e "   フロントエンド: ${GREEN}http://localhost:3006${NC}"
        echo -e "   バックエンド:   ${GREEN}http://localhost:3001${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  終了する場合は Ctrl+C を押してください${NC}"
        echo -e "${YELLOW}   バックエンドも自動的に終了します${NC}"
        echo ""
        
        # 終了時にバックエンドも停止
        trap "echo ''; echo -e '${YELLOW}🛑 サーバーを停止中...${NC}'; kill $BACKEND_PID 2>/dev/null; echo -e '${GREEN}✓ 停止完了${NC}'; exit" INT TERM
        
        # フロントエンドを起動（フォアグラウンド）
        npm run dev
        
        # フロントエンドが終了したらバックエンドも停止
        kill $BACKEND_PID 2>/dev/null
        ;;
        
    2)
        echo -e "${BLUE}🚀 バックエンドのみ起動します...${NC}"
        echo ""
        cd backend
        echo -e "${GREEN}✓ バックエンド起動 (Port: 3001)${NC}"
        echo -e "${BLUE}   API URL: http://localhost:3001${NC}"
        echo ""
        npm run dev
        ;;
        
    3)
        echo -e "${BLUE}🚀 フロントエンドのみ起動します...${NC}"
        echo ""
        echo -e "${GREEN}✓ フロントエンド起動 (Port: 3006)${NC}"
        echo -e "${BLUE}   URL: http://localhost:3006${NC}"
        echo ""
        npm run dev
        ;;
        
    4)
        echo -e "${YELLOW}キャンセルしました${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}無効な選択です${NC}"
        exit 1
        ;;
esac

