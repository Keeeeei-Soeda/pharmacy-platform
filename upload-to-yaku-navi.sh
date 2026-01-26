#!/bin/bash

# yaku-navi.com へのファイルアップロードスクリプト（パスワード不要）
# 実行方法: ./upload-to-yaku-navi.sh

set -e

echo "📤 yaku-navi.com へのファイルアップロード"
echo "=========================================="
echo ""

# プロジェクトルートに移動
cd /Users/soedakei/pharmacy-platform

echo "Step 1: バックエンドをアップロード中..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
  backend/ yaku-navi:/var/www/pharmacy-platform/backend/
echo "✅ バックエンドアップロード完了"
echo ""

echo "Step 2: フロントエンドファイルをアップロード中..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
  app/ yaku-navi:/var/www/pharmacy-platform/app/
rsync -avz --exclude 'node_modules' --exclude '.git' \
  components/ yaku-navi:/var/www/pharmacy-platform/components/
rsync -avz --exclude 'node_modules' --exclude '.git' \
  lib/ yaku-navi:/var/www/pharmacy-platform/lib/
rsync -avz --exclude 'node_modules' --exclude '.git' \
  public/ yaku-navi:/var/www/pharmacy-platform/public/
echo "✅ フロントエンドファイルアップロード完了"
echo ""

echo "Step 3: 設定ファイルをアップロード中..."
scp ecosystem.config.js yaku-navi:/var/www/pharmacy-platform/
scp package.json yaku-navi:/var/www/pharmacy-platform/
scp package-lock.json yaku-navi:/var/www/pharmacy-platform/
scp next.config.ts yaku-navi:/var/www/pharmacy-platform/
scp tsconfig.json yaku-navi:/var/www/pharmacy-platform/
# tailwind.config.tsが存在する場合のみアップロード
[ -f tailwind.config.ts ] && scp tailwind.config.ts yaku-navi:/var/www/pharmacy-platform/ || echo "⚠️  tailwind.config.ts が見つかりません（スキップ）"
scp postcss.config.mjs yaku-navi:/var/www/pharmacy-platform/
scp backend/package.json yaku-navi:/var/www/pharmacy-platform/backend/
scp backend/package-lock.json yaku-navi:/var/www/pharmacy-platform/backend/
echo "✅ 設定ファイルアップロード完了"
echo ""

echo "=========================================="
echo "🎉 アップロード完了！"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "  ssh yaku-navi"
echo "  cd /var/www/pharmacy-platform"
echo ""

