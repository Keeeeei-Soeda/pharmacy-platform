#!/bin/bash

# 薬剤師マッチングプラットフォーム - Prisma Client初期化修正スクリプト
# 実行方法: bash fix-prisma-and-restart.sh

echo "🔧 Prisma Client初期化修正スクリプト"
echo "======================================"
echo ""

# プロジェクトルートディレクトリ（必要に応じて変更してください）
PROJECT_ROOT="/Users/soedakei/pharmacy-platform"

echo "📁 プロジェクトディレクトリ: $PROJECT_ROOT"
echo ""

# ステップ1: Prisma Clientを生成
echo "ステップ1: Prisma Clientを生成中..."
cd "$PROJECT_ROOT"
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client生成成功"
else
    echo "❌ Prisma Client生成失敗"
    exit 1
fi
echo ""

# ステップ2: バックエンドのnode_modulesディレクトリを確認
echo "ステップ2: バックエンドのシンボリックリンクを作成中..."
cd "$PROJECT_ROOT/backend"

# 既存のシンボリックリンクを削除（存在する場合）
rm -rf node_modules/@prisma 2>/dev/null
rm -rf node_modules/.prisma 2>/dev/null

# 新しいシンボリックリンクを作成
ln -sf ../../node_modules/@prisma node_modules/@prisma
ln -sf ../../node_modules/.prisma node_modules/.prisma

if [ $? -eq 0 ]; then
    echo "✅ シンボリックリンク作成成功"
else
    echo "❌ シンボリックリンク作成失敗"
    exit 1
fi
echo ""

# ステップ3: バックエンドサーバーを停止
echo "ステップ3: 既存のバックエンドプロセスを停止中..."
pkill -f "nodemon.*backend" 2>/dev/null
pkill -f "node.*backend/src/server.js" 2>/dev/null
sleep 2
echo "✅ バックエンドプロセス停止完了"
echo ""

# ステップ4: バックエンドサーバーを起動
echo "ステップ4: バックエンドサーバーを起動中..."
cd "$PROJECT_ROOT/backend"

# ログファイルのパス
LOG_FILE="/tmp/backend.log"
echo "📝 ログファイル: $LOG_FILE"
echo ""

# バックエンドをバックグラウンドで起動してログに記録
nohup npm run dev > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

echo "✅ バックエンドサーバーを起動しました (PID: $BACKEND_PID)"
echo ""

# ステップ5: 起動確認
echo "ステップ5: サーバー起動を確認中..."
sleep 3

# ログファイルの最初の20行を表示
echo "--- バックエンドログ (最初の20行) ---"
head -n 20 "$LOG_FILE"
echo "--- ログ終了 ---"
echo ""

# APIが起動しているか確認
echo "ステップ6: API接続確認中..."
sleep 2

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ バックエンドAPI起動確認成功 (http://localhost:3001)"
else
    echo "⚠️  バックエンドAPIへの接続失敗 - ログを確認してください"
    echo "   ログファイル: $LOG_FILE"
fi
echo ""

echo "======================================"
echo "🎉 修正完了！"
echo ""
echo "次のステップ:"
echo "1. フロントエンドをリロード: http://localhost:3000"
echo "2. ログイン画面で以下のアカウントでログインしてください:"
echo "   - 薬局: test-pharmacy@example.com / test1234"
echo "   - 薬剤師: test-pharmacist@example.com / test1234"
echo "3. エラーが出る場合はログを確認:"
echo "   tail -f $LOG_FILE"
echo ""
