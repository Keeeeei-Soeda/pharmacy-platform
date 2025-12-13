#!/bin/bash

# すべてのコントローラーでPrismaのインポートを共有インスタンスに変更するスクリプト

echo "🔧 Prismaインポートを修正中..."
echo ""

CONTROLLERS_DIR="/Users/soedakei/pharmacy-platform/backend/src/controllers"

# 各コントローラーファイルを修正
for file in "$CONTROLLERS_DIR"/*.js; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # 既に個別のPrismaClient初期化がある場合
        if grep -q "const { PrismaClient } = require('@prisma/client');" "$file" && \
           grep -q "const prisma = new PrismaClient();" "$file"; then
            
            echo "📝 修正中: $filename"
            
            # バックアップ作成
            cp "$file" "$file.bak"
            
            # 2行のPrisma初期化を1行の共有インポートに置き換え
            sed -i '' \
                -e "s|const { PrismaClient } = require('@prisma/client');|const prisma = require('../database/prisma');|" \
                -e "/const prisma = new PrismaClient();/d" \
                "$file"
            
            echo "✅ 完了: $filename"
        else
            echo "⏭️  スキップ: $filename (変更不要)"
        fi
    fi
done

echo ""
echo "🎉 すべてのコントローラーの修正が完了しました！"
echo ""
echo "次のステップ:"
echo "1. バックエンドを再起動します..."


