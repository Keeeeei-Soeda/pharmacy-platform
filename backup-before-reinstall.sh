#!/bin/bash

# OS再インストール前のバックアップスクリプト
# 実行方法: ./backup-before-reinstall.sh

set -e

echo "📦 OS再インストール前のバックアップスクリプト"
echo "=============================================="
echo ""

# サーバー情報（編集してください）
SERVER_USER="ユーザー名"
SERVER_HOST="yaku-navi.com"
SERVER_PATH="/var/www/pharmacy-platform"
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"

echo "📋 設定情報:"
echo "  サーバー: $SERVER_HOST"
echo "  ユーザー: $SERVER_USER"
echo "  パス: $SERVER_PATH"
echo "  バックアップ先: $BACKUP_DIR"
echo ""

read -p "この設定で続行しますか？ (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ キャンセルしました"
    exit 1
fi

# バックアップディレクトリを作成
mkdir -p "$BACKUP_DIR"
echo "✅ バックアップディレクトリを作成: $BACKUP_DIR"
echo ""

echo "Step 1: データベースのバックアップ..."
echo "======================================"

# データベースバックアップ
ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /tmp
pg_dump -U postgres pharmacy_platform > pharmacy_platform_backup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ データベースバックアップ完了"
ls -lh pharmacy_platform_backup_*.sql
EOF

# データベースバックアップをダウンロード
echo ""
echo "📥 データベースバックアップをダウンロード中..."
LATEST_DB_BACKUP=$(ssh $SERVER_USER@$SERVER_HOST "ls -t /tmp/pharmacy_platform_backup_*.sql | head -1")
scp $SERVER_USER@$SERVER_HOST:$LATEST_DB_BACKUP "$BACKUP_DIR/"
echo "✅ データベースバックアップをダウンロード: $(basename $LATEST_DB_BACKUP)"
echo ""

echo "Step 2: 環境変数ファイルのバックアップ..."
echo "=========================================="

# バックエンドの環境変数
if ssh $SERVER_USER@$SERVER_HOST "[ -f $SERVER_PATH/backend/.env ]"; then
    scp $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/.env "$BACKUP_DIR/backend.env"
    echo "✅ バックエンド環境変数をバックアップ"
else
    echo "⚠️  バックエンド環境変数ファイルが見つかりません"
fi

# フロントエンドの環境変数
if ssh $SERVER_USER@$SERVER_HOST "[ -f $SERVER_PATH/.env.local ]"; then
    scp $SERVER_USER@$SERVER_HOST:$SERVER_PATH/.env.local "$BACKUP_DIR/frontend.env.local"
    echo "✅ フロントエンド環境変数をバックアップ"
else
    echo "⚠️  フロントエンド環境変数ファイルが見つかりません"
fi

echo ""

echo "Step 3: 設定ファイルのバックアップ..."
echo "====================================="

# Nginx設定
if ssh $SERVER_USER@$SERVER_HOST "[ -f /etc/nginx/sites-available/yaku-navi ]"; then
    ssh $SERVER_USER@$SERVER_HOST "sudo cat /etc/nginx/sites-available/yaku-navi" > "$BACKUP_DIR/nginx.conf"
    echo "✅ Nginx設定をバックアップ"
else
    echo "⚠️  Nginx設定ファイルが見つかりません"
fi

# PM2設定
if ssh $SERVER_USER@$SERVER_HOST "[ -f $SERVER_PATH/ecosystem.config.js ]"; then
    scp $SERVER_USER@$SERVER_HOST:$SERVER_PATH/ecosystem.config.js "$BACKUP_DIR/"
    echo "✅ PM2設定をバックアップ"
else
    echo "⚠️  PM2設定ファイルが見つかりません"
fi

echo ""

echo "Step 4: 現在のシステム情報を記録..."
echo "==================================="

# システム情報を記録
ssh $SERVER_USER@$SERVER_HOST << 'EOF' > "$BACKUP_DIR/system_info.txt"
echo "=== システム情報 ==="
uname -a
echo ""
echo "=== Node.js バージョン ==="
node -v
npm -v
echo ""
echo "=== PM2 バージョン ==="
pm2 -v
echo ""
echo "=== PostgreSQL バージョン ==="
psql --version
echo ""
echo "=== Nginx バージョン ==="
nginx -v
echo ""
echo "=== ディスク使用量 ==="
df -h
echo ""
echo "=== メモリ使用量 ==="
free -h
echo ""
echo "=== PM2プロセス ==="
pm2 list
EOF

echo "✅ システム情報を記録"
echo ""

echo "Step 5: バックアップ内容の確認..."
echo "================================="

echo "📁 バックアップディレクトリ: $BACKUP_DIR"
echo ""
ls -lh "$BACKUP_DIR"
echo ""

echo "=============================================="
echo "🎉 バックアップが完了しました！"
echo "=============================================="
echo ""
echo "📂 バックアップ先: $BACKUP_DIR"
echo ""
echo "📋 バックアップ内容:"
echo "  - データベース: $(ls -1 $BACKUP_DIR/*.sql 2>/dev/null | wc -l) ファイル"
echo "  - 環境変数: $(ls -1 $BACKUP_DIR/*.env* 2>/dev/null | wc -l) ファイル"
echo "  - 設定ファイル: $(ls -1 $BACKUP_DIR/*.conf $BACKUP_DIR/*.js 2>/dev/null | wc -l) ファイル"
echo "  - システム情報: 1 ファイル"
echo ""
echo "💡 次のステップ:"
echo "  1. OS再インストールを実行"
echo "  2. OS_REINSTALL_SETUP.md の手順に従ってセットアップ"
echo "  3. このバックアップから環境変数とデータベースを復元"
echo ""

