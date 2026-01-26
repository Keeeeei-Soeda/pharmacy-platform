#!/bin/bash
# クイックコミットスクリプト
# 使用方法: ./quick-commit.sh "コミットメッセージ"

COMMIT_MESSAGE="${1:-実装内容の更新}"

echo "📦 変更をステージング中..."
git add .

echo "📝 コミット中..."
git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo "✅ コミット完了: $COMMIT_MESSAGE"
    echo ""
    echo "📊 最新のコミット:"
    git log -1 --oneline
else
    echo "❌ コミットに失敗しました"
    exit 1
fi

