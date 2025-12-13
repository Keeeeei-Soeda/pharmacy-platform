#!/bin/bash

# GitHubアップロード前のセキュリティチェックスクリプト

echo "🔒 セキュリティチェック開始..."
echo "=================================================="
echo ""

PROJECT_ROOT="/Users/soedakei/pharmacy-platform"
cd "$PROJECT_ROOT"

ISSUES_FOUND=0

# 1. .envファイルがgit管理下にないか確認
echo "1. 環境変数ファイルのチェック..."
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "❌ エラー: .env がGit管理下にあります！"
    echo "   → 実行: git rm --cached .env"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ .env は追跡されていません"
fi

if git ls-files --error-unmatch .env.local 2>/dev/null; then
    echo "❌ エラー: .env.local がGit管理下にあります！"
    echo "   → 実行: git rm --cached .env.local"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ .env.local は追跡されていません"
fi

if git ls-files --error-unmatch backend/.env 2>/dev/null; then
    echo "❌ エラー: backend/.env がGit管理下にあります！"
    echo "   → 実行: git rm --cached backend/.env"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ backend/.env は追跡されていません"
fi
echo ""

# 2. 実際の機密情報が含まれていないかチェック（ドキュメント内）
echo "2. ドキュメント内の機密情報チェック..."

# JWT_SECRETの実際の値が含まれていないか
if grep -r "JWT_SECRET=.*[^y]$" --include="*.md" . 2>/dev/null | grep -v "your-super-secret"; then
    echo "⚠️ 警告: 実際のJWT_SECRETが含まれている可能性があります"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ JWT_SECRETはサンプルのみ"
fi

# 実際のデータベースパスワードが含まれていないか
if grep -rE "postgresql://[^:]+:[^@]+@[^/]+" --include="*.md" . 2>/dev/null | grep -v "username:password"; then
    echo "⚠️ 警告: 実際のデータベース接続文字列が含まれている可能性があります"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ データベース接続文字列はサンプルのみ"
fi
echo ""

# 3. .gitignoreの確認
echo "3. .gitignore の確認..."
if [ ! -f ".gitignore" ]; then
    echo "❌ エラー: .gitignore が存在しません！"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    REQUIRED_IGNORES=(".env" "node_modules" ".next")
    for pattern in "${REQUIRED_IGNORES[@]}"; do
        if grep -q "$pattern" .gitignore; then
            echo "✅ $pattern は除外設定済み"
        else
            echo "❌ エラー: $pattern が.gitignoreに含まれていません！"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    done
fi
echo ""

# 4. ログファイルのチェック
echo "4. ログファイルのチェック..."
if git ls-files --error-unmatch "*.log" 2>/dev/null; then
    echo "⚠️ 警告: ログファイルがGit管理下にあります"
    echo "   → 実行: git rm --cached *.log"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ ログファイルは追跡されていません"
fi
echo ""

# 5. node_modulesのチェック
echo "5. node_modules のチェック..."
if git ls-files --error-unmatch "node_modules/*" 2>/dev/null | head -1; then
    echo "⚠️ 警告: node_modules がGit管理下にあります"
    echo "   → 実行: git rm -r --cached node_modules"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ node_modules は追跡されていません"
fi
echo ""

# 結果サマリー
echo "=================================================="
echo "📊 チェック結果"
echo "=================================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "🎉 問題は見つかりませんでした！"
    echo "   GitHubへのアップロードは安全です。"
    echo ""
    echo "📝 推奨事項:"
    echo "   1. テストアカウントのパスワードをドキュメントから削除または伏せ字にする"
    echo "   2. READMEに「環境変数は.env.exampleを参考に設定してください」と記載"
    exit 0
else
    echo "⚠️ $ISSUES_FOUND 個の問題が見つかりました。"
    echo "   上記の指示に従って修正してください。"
    echo ""
    echo "🔧 クイックフィックス:"
    echo "   git rm --cached .env .env.local backend/.env"
    echo "   git rm --cached -r node_modules backend/node_modules .next"
    exit 1
fi


