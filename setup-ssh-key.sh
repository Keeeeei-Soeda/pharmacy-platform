#!/bin/bash
# XServer SSH鍵セットアップスクリプト

echo "========================================="
echo "XServer SSH鍵セットアップ"
echo "========================================="
echo ""

# ダウンロードした鍵ファイルの場所を確認
DOWNLOADED_KEY=""
if [ -f "${HOME}/Downloads/xs621921.key" ]; then
    DOWNLOADED_KEY="${HOME}/Downloads/xs621921.key"
elif [ -f "${HOME}/Desktop/xs621921.key" ]; then
    DOWNLOADED_KEY="${HOME}/Desktop/xs621921.key"
else
    echo "⚠️  xs621921.key が見つかりません。"
    echo ""
    echo "ダウンロードした xs621921.key の場所を入力してください："
    read -p "ファイルパス: " DOWNLOADED_KEY
    
    if [ ! -f "${DOWNLOADED_KEY}" ]; then
        echo "❌ ファイルが見つかりません: ${DOWNLOADED_KEY}"
        exit 1
    fi
fi

echo "✅ 鍵ファイルを発見: ${DOWNLOADED_KEY}"
echo ""

# ~/.ssh ディレクトリが存在しない場合は作成
if [ ! -d "${HOME}/.ssh" ]; then
    echo "~/.ssh ディレクトリを作成中..."
    mkdir -p "${HOME}/.ssh"
    chmod 700 "${HOME}/.ssh"
fi

# 鍵ファイルを ~/.ssh/ にコピー
TARGET_KEY="${HOME}/.ssh/xs621921.key"
echo "鍵ファイルを ${TARGET_KEY} にコピー中..."
cp "${DOWNLOADED_KEY}" "${TARGET_KEY}"

# 権限を設定（重要！）
echo "鍵ファイルの権限を設定中..."
chmod 600 "${TARGET_KEY}"

echo ""
echo "✅ SSH鍵のセットアップが完了しました！"
echo ""
echo "接続テストを実行しますか？ (y/n)"
read -p "> " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "接続テスト中..."
    ssh -i "${TARGET_KEY}" pharmacy@yaku-navi.com "echo '✅ SSH接続成功！'"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 接続に成功しました！"
        echo ""
        echo "これで deploy.sh を実行できます："
        echo "  bash deploy.sh"
    else
        echo ""
        echo "❌ 接続に失敗しました。"
        echo "以下を確認してください："
        echo "  - 鍵ファイルが正しく配置されているか"
        echo "  - XServerのSSH設定が有効になっているか"
        echo "  - ユーザー名が 'pharmacy' で正しいか"
    fi
fi

echo ""
echo "========================================="
