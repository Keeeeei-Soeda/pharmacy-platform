#!/bin/bash

# 薬剤師マッチングプラットフォーム - 必須ファイルチェックスクリプト

echo "🔍 薬剤師マッチングプラットフォーム - 必須ファイルチェック"
echo "=================================================="
echo ""

PROJECT_ROOT="/Users/soedakei/pharmacy-platform"
cd "$PROJECT_ROOT"

MISSING_FILES=0
TOTAL_FILES=0

check_file() {
  local file=$1
  local description=$2
  TOTAL_FILES=$((TOTAL_FILES + 1))
  
  if [ -f "$file" ]; then
    echo "✅ $file - $description"
  else
    echo "❌ $file - $description (NOT FOUND)"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
}

echo "📁 フロントエンド設定ファイル"
echo "--------------------------------------------------"
check_file "package.json" "プロジェクト依存関係"
check_file "next.config.ts" "Next.js設定"
check_file "tailwind.config.ts" "Tailwind CSS設定"
check_file "tsconfig.json" "TypeScript設定"
check_file ".env.local" "環境変数（フロントエンド）"
echo ""

echo "🏠 共通ページ"
echo "--------------------------------------------------"
check_file "app/layout.tsx" "ルートレイアウト"
check_file "app/page.tsx" "トップページ"
echo ""

echo "🔐 認証ページ"
echo "--------------------------------------------------"
check_file "app/auth/login/page.tsx" "ログインページ"
check_file "app/auth/register/page.tsx" "新規登録ページ"
echo ""

echo "📱 ダッシュボード"
echo "--------------------------------------------------"
check_file "app/pharmacist/dashboard/page.tsx" "薬剤師ダッシュボード"
check_file "app/pharmacy/dashboard/page.tsx" "薬局ダッシュボード"
echo ""

echo "🌐 API Client"
echo "--------------------------------------------------"
check_file "lib/api-client.ts" "ベースAPIクライアント"
check_file "lib/api/index.ts" "API統合エクスポート"
check_file "lib/api/auth.ts" "認証API"
check_file "lib/api/jobs.ts" "求人API"
check_file "lib/api/applications.ts" "応募API"
check_file "lib/api/messages.ts" "メッセージAPI"
check_file "lib/api/contracts.ts" "契約API"
check_file "lib/api/schedules.ts" "スケジュールAPI"
check_file "lib/api/profiles.ts" "プロフィールAPI"
check_file "lib/api/uploads.ts" "アップロードAPI"
check_file "lib/api/admin.ts" "管理API"
echo ""

echo "🔧 バックエンド設定"
echo "--------------------------------------------------"
check_file "backend/package.json" "バックエンド依存関係"
check_file "backend/.env" "バックエンド環境変数"
check_file "backend/src/server.js" "サーバーエントリーポイント"
check_file "backend/src/app.js" "Expressアプリ設定"
echo ""

echo "🔌 バックエンドルート"
echo "--------------------------------------------------"
check_file "backend/src/routes/auth.js" "認証ルート"
check_file "backend/src/routes/jobs.js" "求人ルート"
check_file "backend/src/routes/applications.js" "応募ルート"
check_file "backend/src/routes/messages.js" "メッセージルート"
check_file "backend/src/routes/contracts.js" "契約ルート"
check_file "backend/src/routes/pharmacists.js" "薬剤師プロフィールルート"
check_file "backend/src/routes/pharmacies.js" "薬局プロフィールルート"
check_file "backend/src/routes/schedules.js" "スケジュールルート"
check_file "backend/src/routes/uploads.js" "アップロードルート"
check_file "backend/src/routes/admin.js" "管理ルート"
echo ""

echo "🎮 バックエンドコントローラー"
echo "--------------------------------------------------"
check_file "backend/src/controllers/authController.js" "認証コントローラー"
check_file "backend/src/controllers/jobController.js" "求人コントローラー"
check_file "backend/src/controllers/applicationController.js" "応募コントローラー"
check_file "backend/src/controllers/messageController.js" "メッセージコントローラー"
check_file "backend/src/controllers/contractController.js" "契約コントローラー"
check_file "backend/src/controllers/pharmacistController.js" "薬剤師プロフィールコントローラー"
check_file "backend/src/controllers/pharmacyController.js" "薬局プロフィールコントローラー"
check_file "backend/src/controllers/scheduleController.js" "スケジュールコントローラー"
check_file "backend/src/controllers/uploadController.js" "アップロードコントローラー"
check_file "backend/src/controllers/adminController.js" "管理コントローラー"
echo ""

echo "🔒 ミドルウェア"
echo "--------------------------------------------------"
check_file "backend/src/middleware/auth.js" "認証ミドルウェア"
check_file "backend/src/middleware/validation.js" "バリデーションミドルウェア"
echo ""

echo "🗄️ データベース"
echo "--------------------------------------------------"
check_file "backend/src/database/connection.js" "DB接続プール"
check_file "backend/src/config/database.js" "DB設定"
echo ""

echo "🛠️ ユーティリティ"
echo "--------------------------------------------------"
check_file "backend/src/utils/generateToken.js" "JWTトークン生成"
check_file "backend/src/utils/hashPassword.js" "パスワードハッシュ"
check_file "backend/src/utils/sendEmail.js" "メール送信"
check_file "backend/src/config/auth.js" "認証設定"
echo ""

echo "🗃️ データベーススキーマ"
echo "--------------------------------------------------"
check_file "prisma/schema.prisma" "Prismaスキーマ"
check_file ".env" "データベース接続URL"
echo ""

echo "=================================================="
echo "📊 チェック結果"
echo "=================================================="
echo "総ファイル数: $TOTAL_FILES"
echo "存在するファイル: $((TOTAL_FILES - MISSING_FILES))"
echo "不足ファイル: $MISSING_FILES"
echo ""

if [ $MISSING_FILES -eq 0 ]; then
  echo "🎉 すべての必須ファイルが揃っています！"
  exit 0
else
  echo "⚠️ $MISSING_FILES 個のファイルが不足しています。"
  echo "上記のリストを確認して、不足ファイルを作成してください。"
  exit 1
fi


