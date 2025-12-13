# 薬剤師マッチングプラットフォーム - 実装総まとめ

> 最終更新日: 2025 年 11 月 26 日

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [実装フェーズと進捗](#実装フェーズと進捗)
4. [ファイル構成](#ファイル構成)
5. [機能詳細](#機能詳細)
6. [API 仕様](#api仕様)
7. [データベーススキーマ](#データベーススキーマ)
8. [使い方・テスト方法](#使い方テスト方法)
9. [今後の拡張予定](#今後の拡張予定)

---

## プロジェクト概要

### 🎯 プロジェクトの目的

薬剤師と薬局をマッチングし、短期・単発の勤務契約を効率的に管理するプラットフォームの構築。

### 📊 システム全体像

```
┌─────────────────────────────────────────────────────────┐
│                    薬剤師マッチングプラットフォーム          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   薬剤師     │  │   薬局       │  │   運営      │  │
│  │   ダッシュ   │  │   ダッシュ   │  │   管理画面  │  │
│  │   ボード     │  │   ボード     │  │            │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  │
│         │                 │                 │         │
│         └─────────────────┴─────────────────┘         │
│                           │                           │
│                    ┌──────▼───────┐                   │
│                    │   Backend    │                   │
│                    │   API Server │                   │
│                    └──────┬───────┘                   │
│                           │                           │
│                    ┌──────▼───────┐                   │
│                    │  PostgreSQL  │                   │
│                    │  Database    │                   │
│                    └──────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 技術スタック

### フロントエンド

| 技術                      | バージョン | 用途                                    |
| ------------------------- | ---------- | --------------------------------------- |
| Next.js                   | 15.5.4     | React フレームワーク（App Router 使用） |
| React                     | 18.x       | UI ライブラリ                           |
| TypeScript                | 5.x        | 型安全な開発                            |
| Tailwind CSS              | 3.x        | スタイリング                            |
| Lucide React              | -          | アイコンライブラリ                      |
| react-calendar            | -          | カレンダー UI                           |
| browser-image-compression | -          | クライアント側画像圧縮                  |
| Axios                     | -          | HTTP 通信                               |

### バックエンド

| 技術       | バージョン | 用途                   |
| ---------- | ---------- | ---------------------- |
| Node.js    | 18.x       | サーバーサイド実行環境 |
| Express.js | 4.x        | Web フレームワーク     |
| Prisma     | 6.x        | ORM                    |
| PostgreSQL | 14.x       | データベース           |
| JWT        | -          | 認証トークン           |
| bcrypt     | -          | パスワードハッシュ化   |
| Multer     | -          | ファイルアップロード   |
| dotenv     | -          | 環境変数管理           |
| Helmet     | -          | セキュリティ           |
| CORS       | -          | クロスオリジン対応     |

### 開発ツール

- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマッター（推奨）
- **Git**: バージョン管理

---

## 実装フェーズと進捗

### ✅ Phase 1: 証明書アップロード機能（薬剤師側）【完了】

#### 実装期間

2025 年 11 月 26 日

#### 実装内容

- [x] 画像自動圧縮機能（最大 1MB に削減）
- [x] 薬剤師免許証アップロード
- [x] 保険薬剤師登録票アップロード
- [x] JPG, PNG, PDF 対応（最大 10MB）
- [x] 再アップロード機能
- [x] 証明書削除機能
- [x] 本人確認ステータス表示
- [x] アップロード日時表示

#### 実装ファイル

```
backend/src/
  ├── controllers/uploadController.js    # アップロード処理
  ├── routes/uploads.js                  # ルート定義
  └── uploads/licenses/                  # ファイル保存先

frontend/
  ├── lib/api/uploads.ts                 # アップロードAPI
  └── app/pharmacist/dashboard/page.tsx  # UI実装
```

---

### ✅ Phase 2: 運営管理画面【完了】

#### 実装期間

2025 年 11 月 26 日

#### 実装内容

- [x] 薬剤師一覧表示（フィルター・検索対応）
- [x] 統計ダッシュボード（全体/未確認/承認済み/却下）
- [x] 薬剤師詳細表示
- [x] 証明書閲覧・ダウンロード機能
- [x] 本人確認承認機能
- [x] 本人確認却下機能（理由入力必須）
- [x] 本人確認ステータスリセット機能

#### 実装ファイル

```
backend/src/
  ├── controllers/adminController.js     # 運営管理処理
  └── routes/admin.js                    # ルート定義

frontend/
  ├── lib/api/admin.ts                   # 運営管理API
  └── app/admin/pharmacists/page.tsx     # 運営管理画面
```

---

### ✅ Phase 3: プロフィール編集機能【完了】

#### 実装期間

2025 年 11 月 26 日

#### 実装内容

- [x] 薬剤師プロフィール編集 UI
- [x] 基本情報編集（氏名、電話番号、生年月日）
- [x] 住所情報編集（郵便番号、都道府県、市区町村、住所、最寄り駅）
- [x] 資格情報編集（免許番号、免許取得日、卒業大学、卒業年、経験年数）
- [x] 自己紹介編集
- [x] プロフィール表示/編集モード切り替え
- [x] リアルタイムバリデーション
- [x] 薬局プロフィール API 準備完了

#### 実装ファイル

```
backend/src/
  ├── controllers/pharmacistController.js  # 薬剤師プロフィール
  └── controllers/pharmacyController.js    # 薬局プロフィール

frontend/
  ├── lib/api/profiles.ts                  # プロフィールAPI
  ├── app/pharmacist/dashboard/page.tsx    # 薬剤師プロフィール編集
  └── app/pharmacy/dashboard/page.tsx      # 薬局プロフィール管理
```

---

### 🔄 既存実装（Phase 1-3 以前）

#### 認証機能

- [x] ユーザー登録（薬剤師/薬局）
- [x] ログイン/ログアウト
- [x] JWT 認証
- [x] 権限チェック

#### 募集・応募機能

- [x] 求人掲載（薬局側）
- [x] 求人検索・閲覧（薬剤師側）
- [x] 求人応募機能
- [x] 応募管理

#### メッセージ機能

- [x] 1 対 1 メッセージング
- [x] スレッド管理
- [x] 未読カウント
- [x] メッセージ既読管理

#### 契約管理機能

- [x] 契約書作成・送信
- [x] 契約承認/拒否
- [x] 契約一覧表示
- [x] 契約詳細表示

#### スケジュール管理機能

- [x] 勤務スケジュール自動生成
- [x] 月間カレンダー表示
- [x] 週間カレンダー表示
- [x] スケジュール詳細表示
- [x] 日給ベースの報酬計算

---

## ファイル構成

### 📂 プロジェクト全体構造

```
pharmacy-platform/
├── app/                          # Next.js App Router
│   ├── auth/                     # 認証ページ
│   │   ├── login/               # ログイン
│   │   └── register/            # 新規登録
│   ├── pharmacist/              # 薬剤師向けページ
│   │   └── dashboard/           # 薬剤師ダッシュボード
│   ├── pharmacy/                # 薬局向けページ
│   │   └── dashboard/           # 薬局ダッシュボード
│   ├── admin/                   # 運営管理ページ
│   │   └── pharmacists/         # 薬剤師管理
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # トップページ
│   └── globals.css              # グローバルスタイル
│
├── lib/                         # ユーティリティ・API
│   ├── api/                     # API関数
│   │   ├── auth.ts             # 認証API
│   │   ├── jobs.ts             # 求人API
│   │   ├── applications.ts     # 応募API
│   │   ├── messages.ts         # メッセージAPI
│   │   ├── contracts.ts        # 契約API
│   │   ├── schedules.ts        # スケジュールAPI
│   │   ├── uploads.ts          # アップロードAPI
│   │   ├── admin.ts            # 運営管理API
│   │   ├── profiles.ts         # プロフィールAPI
│   │   └── index.ts            # API統合エクスポート
│   └── api-client.ts           # Axiosクライアント設定
│
├── backend/                     # Express.js バックエンド
│   ├── src/
│   │   ├── controllers/        # コントローラー
│   │   │   ├── authController.js
│   │   │   ├── jobController.js
│   │   │   ├── applicationController.js
│   │   │   ├── messageController.js
│   │   │   ├── contractController.js
│   │   │   ├── scheduleController.js
│   │   │   ├── pharmacistController.js
│   │   │   ├── pharmacyController.js
│   │   │   ├── uploadController.js
│   │   │   └── adminController.js
│   │   ├── routes/             # ルート定義
│   │   │   ├── auth.js
│   │   │   ├── jobs.js
│   │   │   ├── applications.js
│   │   │   ├── messages.js
│   │   │   ├── contracts.js
│   │   │   ├── schedules.js
│   │   │   ├── pharmacists.js
│   │   │   ├── pharmacies.js
│   │   │   ├── uploads.js
│   │   │   └── admin.js
│   │   ├── middleware/         # ミドルウェア
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── database/           # データベース
│   │   │   ├── connection.js
│   │   │   └── queries.js
│   │   ├── config/             # 設定
│   │   │   ├── auth.js
│   │   │   └── database.js
│   │   ├── utils/              # ユーティリティ
│   │   │   ├── generateToken.js
│   │   │   ├── hashPassword.js
│   │   │   └── sendEmail.js
│   │   ├── app.js              # Express設定
│   │   └── server.js           # サーバー起動
│   ├── uploads/                # アップロードファイル保存先
│   │   └── licenses/           # 証明書ファイル
│   ├── package.json
│   └── .env                    # 環境変数
│
├── prisma/
│   └── schema.prisma           # Prismaスキーマ定義
│
├── public/                     # 静的ファイル
│
├── docs/                       # ドキュメント
│
├── package.json                # フロントエンド依存関係
├── next.config.ts              # Next.js設定
├── tailwind.config.ts          # Tailwind設定
├── tsconfig.json               # TypeScript設定
├── .env.local                  # フロントエンド環境変数
├── .gitignore                  # Git除外設定
├── README.md                   # プロジェクト説明
├── PROJECT_PROGRESS.md         # 進捗レポート
└── IMPLEMENTATION_SUMMARY.md   # このファイル
```

---

## 機能詳細

### 🔐 認証機能

#### 機能概要

- ユーザー登録（薬剤師/薬局の 2 種類）
- メール/パスワードによるログイン
- JWT（JSON Web Token）による認証
- 自動ログアウト（トークン有効期限管理）

#### 主要エンドポイント

```
POST /api/auth/register   # 新規登録
POST /api/auth/login      # ログイン
GET  /api/auth/me         # 現在のユーザー情報取得
```

#### 使用技術

- **JWT**: 認証トークン（有効期限: 7 日）
- **bcrypt**: パスワードハッシュ化（salt rounds: 10）
- **localStorage**: トークン保存（フロントエンド）

---

### 💼 求人・応募機能

#### 機能概要（薬局側）

- 求人掲載作成
- 掲載求人一覧表示
- 応募者リスト表示
- 応募者詳細確認

#### 機能概要（薬剤師側）

- 求人検索（エリア、時給、条件など）
- 求人詳細表示
- 求人応募
- 応募履歴確認

#### 求人情報項目

- 基本情報（薬局名、所在地、最寄り駅）
- 勤務条件（時給、勤務時間、休憩時間）
- **スケジュール情報（新規追加）**
  - 日給
  - 契約期間（日数）
  - 勤務予定曜日
  - 希望開始日

#### 主要エンドポイント

```
# 薬局側
POST   /api/jobs              # 求人掲載
GET    /api/jobs/my-jobs      # 自分の求人一覧
PUT    /api/jobs/:id          # 求人更新
DELETE /api/jobs/:id          # 求人削除

# 薬剤師側
GET    /api/jobs              # 求人検索
GET    /api/jobs/:id          # 求人詳細
POST   /api/applications      # 求人応募
GET    /api/applications/me   # 自分の応募履歴
```

---

### 💬 メッセージ機能

#### 機能概要

- 1 対 1 のメッセージング（薬局 ↔ 薬剤師）
- スレッド形式の会話管理
- 未読メッセージカウント
- リアルタイム既読管理

#### スレッド作成タイミング

- 薬剤師が求人に応募したとき自動生成
- 薬局が契約書を送信したとき自動生成

#### 主要エンドポイント

```
GET  /api/messages/threads        # スレッド一覧
GET  /api/messages/threads/:id    # メッセージ取得
POST /api/messages                # メッセージ送信
GET  /api/messages/unread-count   # 未読数取得
PUT  /api/messages/mark-read/:id  # 既読マーク
```

---

### 📝 契約管理機能

#### 機能概要（薬局側）

- 契約書（勤務通知書）作成
- 契約書送信
- 契約ステータス管理

#### 機能概要（薬剤師側）

- 契約書受信
- 契約内容確認
- 契約承認/拒否
- 契約一覧表示

#### 契約ステータス

- `pending`: 承認待ち
- `active`: 契約中
- `rejected`: 拒否
- `completed`: 完了
- `cancelled`: キャンセル

#### 契約承認時の自動処理

1. 契約ステータスを`active`に更新
2. 勤務スケジュールを自動生成
3. 日給情報をコピー
4. 勤務予定曜日をコピー

#### 主要エンドポイント

```
# 薬局側
POST /api/contracts/send-offer    # 契約書送信
GET  /api/contracts/pharmacy      # 自分の契約一覧

# 薬剤師側
GET  /api/contracts/pharmacist    # 自分の契約一覧
POST /api/contracts/:id/accept    # 契約承認
POST /api/contracts/:id/reject    # 契約拒否
```

---

### 📅 スケジュール管理機能

#### 機能概要

- **自動スケジュール生成**（契約承認時）
- 月間カレンダー表示
- 週間カレンダー表示
- スケジュール詳細表示
- 日給ベースの報酬計算

#### スケジュール生成ロジック

```javascript
// 契約承認時に自動実行
1. 契約の開始日を取得
2. 契約期間（日数）を取得
3. 勤務予定曜日を取得
4. 期間内の該当曜日にスケジュールを作成
5. 各スケジュールに勤務時間・休憩時間を設定
```

#### カレンダー機能

- **月間ビュー**: 月全体の勤務日をハイライト表示
- **週間ビュー**: 選択した週の詳細スケジュール表示
- **日付クリック**: 該当日のスケジュール詳細をモーダル表示

#### スケジュールデータ項目

- 契約 ID
- 勤務日
- 予定開始時刻
- 予定終了時刻
- 休憩時間（分）
- メモ

#### 主要エンドポイント

```
# 薬局側
GET  /api/schedules/contract/:id  # 契約別スケジュール取得
GET  /api/schedules/pharmacy      # 薬局のスケジュール取得

# 薬剤師側
GET  /api/schedules/pharmacist    # 薬剤師のスケジュール取得

# 共通
POST   /api/schedules             # スケジュール作成
PUT    /api/schedules/:id         # スケジュール更新
DELETE /api/schedules/:id         # スケジュール削除
```

---

### 📄 証明書アップロード機能

#### 機能概要

- 薬剤師免許証のアップロード
- 保険薬剤師登録票のアップロード
- クライアント側での自動画像圧縮
- 証明書の再アップロード
- 証明書の削除

#### 対応ファイル形式

- **画像**: JPG, PNG（自動圧縮）
- **文書**: PDF
- **最大サイズ**: 10MB

#### 画像圧縮仕様

- **圧縮ライブラリ**: browser-image-compression
- **圧縮後サイズ**: 最大 1MB
- **最大解像度**: 1920px
- **Web Worker を使用**: UI ブロックなし

#### ファイル命名規則

```
user-{userId}-{type}-{timestamp}.{拡張子}

例:
user-abc123-license-1700000000000.jpg
user-abc123-registration-1700000000000.pdf
```

#### セキュリティ

- **認証必須**: ログインユーザーのみアクセス可能
- **所有者チェック**: 自分のファイルのみ閲覧・削除可能
- **運営・薬局アクセス**: 本人確認・契約確認用にアクセス可能
- **直接 URL 防止**: トークン付き URL でのみアクセス可能

#### 主要エンドポイント

```
POST   /api/uploads/license           # 証明書アップロード
GET    /api/uploads/license/info      # 証明書情報取得
GET    /api/uploads/license/:filename # ファイル取得
DELETE /api/uploads/license/:type     # 証明書削除
```

#### 本人確認ステータス

- `pending`: 未確認（デフォルト）
- `approved`: 承認済み
- `rejected`: 却下

---

### 👨‍💼 運営管理機能

#### 機能概要

- 薬剤師一覧表示
- 本人確認ステータス管理
- 証明書閲覧・確認
- 承認/却下処理
- 統計ダッシュボード

#### 統計情報

- 全薬剤師数
- 未確認の薬剤師数
- 承認済みの薬剤師数
- 却下された薬剤師数

#### フィルター・検索機能

- **ステータスフィルター**: 全て/未確認/承認済み/却下
- **検索**: 名前、メールアドレス、免許番号で検索
- **リアルタイムフィルタリング**: 入力即時反映

#### 薬剤師詳細画面

表示項目:

- 基本情報（氏名、連絡先、住所）
- 免許情報（免許番号、経験年数）
- 証明書（アップロード状況、閲覧リンク）
- 本人確認ステータス
- 応募履歴（最新 5 件）
- 契約履歴（最新 5 件）

#### 承認/却下処理

- **承認**:
  - 両方の証明書がアップロード済みであること
  - 任意でメモを追加可能
  - ステータスを`approved`に更新
  - 承認日時を記録
- **却下**:
  - 却下理由の入力必須
  - ステータスを`rejected`に更新
  - 理由を verificationNotes に保存
- **リセット**:
  - ステータスを`pending`に戻す
  - 承認/却下情報をクリア

#### 主要エンドポイント

```
GET  /api/admin/statistics           # 統計情報
GET  /api/admin/pharmacists          # 薬剤師一覧
GET  /api/admin/pharmacists/:id      # 薬剤師詳細
POST /api/admin/pharmacists/:id/approve  # 承認
POST /api/admin/pharmacists/:id/reject   # 却下
POST /api/admin/pharmacists/:id/reset    # リセット
```

#### アクセス制限

現在は認証のみ必要。将来的に`admin`ユーザータイプを追加予定。

```javascript
// 将来の実装予定
router.get(
  "/admin/pharmacists",
  authenticateToken,
  requireUserType(["admin"]), // ← admin権限チェック
  getPharmacists
);
```

---

### 👤 プロフィール編集機能

#### 薬剤師プロフィール

**編集可能項目:**

1. **基本情報**

   - 姓・名（必須）
   - 姓カナ・名カナ
   - 電話番号
   - 生年月日

2. **住所情報**

   - 郵便番号
   - 都道府県
   - 市区町村
   - 番地・建物名
   - 最寄り駅

3. **資格情報**

   - 薬剤師免許番号
   - 免許取得日
   - 卒業大学
   - 卒業年
   - 実務経験年数

4. **その他**
   - 自己紹介・プロフィール文

#### 薬局プロフィール

**編集可能項目:**

1. **基本情報**

   - 薬局名（必須）
   - 薬局名カナ
   - 代表者名
   - 電話番号
   - FAX 番号

2. **所在地情報**

   - 郵便番号
   - 都道府県
   - 市区町村
   - 住所
   - 最寄り駅

3. **営業情報**

   - 営業時間開始
   - 営業時間終了
   - 定休日
   - 設立日

4. **業務情報**

   - 1 日処方箋枚数
   - スタッフ数
   - 薬局説明文

5. **その他**
   - 特徴（配列）
   - 設備（配列）
   - ウェブサイト URL

#### UI/UX

- **表示モード**: 現在の情報を表示
- **編集モード**: フォーム入力で編集
- **切り替えボタン**: 「編集する」/「キャンセル」/「保存する」
- **リアルタイムバリデーション**: 必須項目チェック
- **保存フィードバック**: 成功/失敗メッセージ表示

#### 主要エンドポイント

```
# 薬剤師
GET  /api/pharmacists/profile    # プロフィール取得
POST /api/pharmacists/profile    # プロフィール作成
PUT  /api/pharmacists/profile    # プロフィール更新

# 薬局
GET  /api/pharmacies/profile     # プロフィール取得
POST /api/pharmacies/profile     # プロフィール作成
PUT  /api/pharmacies/profile     # プロフィール更新
```

---

## API 仕様

### 🔑 認証

すべての API（ログイン・登録を除く）は認証が必要です。

**認証方法:**

```javascript
// リクエストヘッダーに含める
Authorization: Bearer {JWT_TOKEN}
```

**エラーレスポンス:**

```json
{
  "error": "アクセストークンが必要です"
}
```

---

### 📋 共通レスポンス形式

#### 成功レスポンス

```json
{
  "message": "成功メッセージ",
  "data": { ... }
}
```

#### エラーレスポンス

```json
{
  "error": "エラーメッセージ"
}
```

---

### 🔐 認証 API

#### POST /api/auth/register

**説明**: 新規ユーザー登録

**リクエスト:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "userType": "pharmacist", // or "pharmacy"
  "firstName": "太郎", // 薬剤師の場合
  "lastName": "山田" // 薬剤師の場合
}
```

**レスポンス:**

```json
{
  "message": "登録が完了しました",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "pharmacist",
    "isVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/login

**説明**: ログイン

**リクエスト:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**

```json
{
  "message": "ログインに成功しました",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "pharmacist",
    "isVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET /api/auth/me

**説明**: 現在のユーザー情報取得

**レスポンス:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "pharmacist",
    "isVerified": true,
    "createdAt": "2025-11-26T00:00:00.000Z",
    "lastLogin": "2025-11-26T10:00:00.000Z"
  }
}
```

---

### 💼 求人 API

#### POST /api/jobs

**説明**: 求人掲載作成（薬局のみ）

**リクエスト:**

```json
{
  "title": "調剤薬局薬剤師募集",
  "description": "処方箋応需業務全般",
  "prefecture": "東京都",
  "city": "渋谷区",
  "address": "渋谷1-1-1",
  "nearestStation": "渋谷駅",
  "hourlyRate": 3000,
  "dailyRate": 20000,
  "workHoursStart": "09:00",
  "workHoursEnd": "18:00",
  "breakTimeMinutes": 60,
  "scheduledWorkDays": ["1", "2", "3", "4", "5"], // 月〜金
  "suggestedStartDate": "2025-12-01",
  "contractDurationDays": 30
}
```

**レスポンス:**

```json
{
  "message": "求人を掲載しました",
  "job": {
    "id": "uuid",
    "title": "調剤薬局薬剤師募集",
    "status": "active",
    "createdAt": "2025-11-26T00:00:00.000Z"
  }
}
```

#### GET /api/jobs

**説明**: 求人検索（薬剤師向け）

**クエリパラメータ:**

```
?prefecture=東京都
&city=渋谷区
&hourlyRateMin=2500
&hourlyRateMax=5000
```

**レスポンス:**

```json
{
  "jobs": [
    {
      "id": "uuid",
      "title": "調剤薬局薬剤師募集",
      "pharmacy": {
        "pharmacyName": "〇〇薬局",
        "prefecture": "東京都",
        "city": "渋谷区"
      },
      "hourlyRate": 3000,
      "dailyRate": 20000,
      "scheduledWorkDays": ["1", "2", "3", "4", "5"],
      "createdAt": "2025-11-26T00:00:00.000Z"
    }
  ]
}
```

---

### 📨 応募 API

#### POST /api/applications

**説明**: 求人に応募（薬剤師のみ）

**リクエスト:**

```json
{
  "jobPostingId": "uuid",
  "coverLetter": "応募動機や自己PR"
}
```

**レスポンス:**

```json
{
  "message": "応募が完了しました",
  "application": {
    "id": "uuid",
    "status": "pending",
    "appliedAt": "2025-11-26T00:00:00.000Z"
  }
}
```

---

### 💬 メッセージ API

#### GET /api/messages/threads

**説明**: メッセージスレッド一覧取得

**レスポンス:**

```json
{
  "threads": [
    {
      "id": "uuid",
      "otherUser": {
        "id": "uuid",
        "name": "〇〇薬局"
      },
      "lastMessage": {
        "content": "よろしくお願いします",
        "createdAt": "2025-11-26T10:00:00.000Z"
      },
      "unreadCount": 2
    }
  ]
}
```

#### POST /api/messages

**説明**: メッセージ送信

**リクエスト:**

```json
{
  "threadId": "uuid",
  "content": "メッセージ内容"
}
```

---

### 📝 契約 API

#### POST /api/contracts/send-offer

**説明**: 契約書（勤務通知書）送信（薬局のみ）

**リクエスト:**

```json
{
  "applicationId": "uuid",
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "hourlyRate": 3000,
  "workHoursStart": "09:00",
  "workHoursEnd": "18:00",
  "workNotice": "勤務に関する注意事項"
}
```

#### POST /api/contracts/:id/accept

**説明**: 契約承認（薬剤師のみ）

**自動処理:**

1. 契約ステータスを`active`に更新
2. 勤務スケジュールを自動生成
3. メッセージスレッドに通知を送信

---

### 📅 スケジュール API

#### GET /api/schedules/contract/:contractId

**説明**: 契約別スケジュール取得

**レスポンス:**

```json
{
  "schedules": [
    {
      "id": "uuid",
      "workDate": "2025-12-02", // 月曜日
      "scheduledStartTime": "09:00:00",
      "scheduledEndTime": "18:00:00",
      "breakTimeMinutes": 60,
      "notes": "契約承認時に自動作成",
      "contract": {
        "pharmacy": {
          "pharmacyName": "〇〇薬局"
        }
      }
    }
  ]
}
```

#### GET /api/schedules/pharmacist

**説明**: 薬剤師の全スケジュール取得

**レスポンス:**

```json
{
  "schedules": [
    {
      "id": "uuid",
      "workDate": "2025-12-02",
      "scheduledStartTime": "09:00:00",
      "scheduledEndTime": "18:00:00",
      "contract": {
        "id": "uuid",
        "pharmacy": {
          "pharmacyName": "〇〇薬局",
          "prefecture": "東京都",
          "city": "渋谷区"
        }
      }
    }
  ]
}
```

---

### 📄 証明書アップロード API

#### POST /api/uploads/license

**説明**: 証明書アップロード（薬剤師のみ）

**リクエスト:**

```
Content-Type: multipart/form-data

file: [File object]
type: "license" または "registration"
```

**レスポンス:**

```json
{
  "message": "証明書をアップロードしました",
  "file": {
    "filename": "user-abc123-license-1700000000000.jpg",
    "path": "uploads/licenses/user-abc123-license-1700000000000.jpg",
    "size": 512000,
    "uploadedAt": "2025-11-26T10:00:00.000Z"
  }
}
```

#### GET /api/uploads/license/info

**説明**: 証明書情報取得（薬剤師のみ）

**レスポンス:**

```json
{
  "license": {
    "uploaded": true,
    "path": "uploads/licenses/user-abc123-license-1700000000000.jpg",
    "uploadedAt": "2025-11-26T10:00:00.000Z"
  },
  "registration": {
    "uploaded": true,
    "path": "uploads/licenses/user-abc123-registration-1700000000000.jpg",
    "uploadedAt": "2025-11-26T10:00:00.000Z"
  },
  "verificationStatus": "pending",
  "verifiedAt": null
}
```

#### GET /api/uploads/license/:filename

**説明**: 証明書ファイル取得（認証必須）

**アクセス権限:**

- ファイルの所有者（薬剤師本人）
- 薬局（契約確認用）
- 運営（本人確認用）

**レスポンス:**
ファイルバイナリデータ

---

### 👨‍💼 運営管理 API

#### GET /api/admin/statistics

**説明**: 統計情報取得（運営のみ）

**レスポンス:**

```json
{
  "total": 45,
  "pending": 12,
  "approved": 30,
  "rejected": 3
}
```

#### GET /api/admin/pharmacists

**説明**: 薬剤師一覧取得（運営のみ）

**クエリパラメータ:**

```
?status=pending          # ステータスフィルター
&search=田中            # 検索キーワード
```

**レスポンス:**

```json
{
  "total": 12,
  "pharmacists": [
    {
      "id": "uuid",
      "fullName": "田中 花子",
      "fullNameKana": "タナカ ハナコ",
      "email": "tanaka@example.com",
      "licenseNumber": "123456",
      "prefecture": "東京都",
      "city": "渋谷区",
      "experienceYears": 5,
      "verificationStatus": "pending",
      "licenseUploaded": true,
      "registrationUploaded": true,
      "createdAt": "2025-11-20T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/admin/pharmacists/:id/approve

**説明**: 本人確認承認（運営のみ）

**リクエスト:**

```json
{
  "notes": "確認完了" // 任意
}
```

**レスポンス:**

```json
{
  "message": "本人確認を承認しました",
  "pharmacist": {
    "id": "uuid",
    "verificationStatus": "approved",
    "verifiedAt": "2025-11-26T10:00:00.000Z"
  }
}
```

#### POST /api/admin/pharmacists/:id/reject

**説明**: 本人確認却下（運営のみ）

**リクエスト:**

```json
{
  "reason": "証明書が不鮮明です" // 必須
}
```

---

### 👤 プロフィール API

#### GET /api/pharmacists/profile

**説明**: 薬剤師プロフィール取得

**レスポンス:**

```json
{
  "profile": {
    "id": "uuid",
    "firstName": "花子",
    "lastName": "田中",
    "firstNameKana": "ハナコ",
    "lastNameKana": "タナカ",
    "phone": "090-1234-5678",
    "prefecture": "東京都",
    "city": "渋谷区",
    "licenseNumber": "123456",
    "experienceYears": 5,
    "bio": "自己紹介文",
    "createdAt": "2025-11-20T00:00:00.000Z",
    "updatedAt": "2025-11-26T10:00:00.000Z"
  }
}
```

#### PUT /api/pharmacists/profile

**説明**: 薬剤師プロフィール更新

**リクエスト:**

```json
{
  "firstName": "花子",
  "lastName": "田中",
  "phone": "090-1234-5678",
  "prefecture": "東京都",
  "city": "渋谷区",
  "address": "渋谷1-1-1",
  "experienceYears": 6,
  "bio": "更新された自己紹介文"
}
```

---

## データベーススキーマ

### ER 図（概要）

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    Users     │       │ PharmacistProfile│       │  PharmacyProfile │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │───────│ userId (FK)      │       │ userId (FK)      │───────┐
│ email        │       │ firstName        │       │ pharmacyName     │       │
│ password     │       │ lastName         │       │ representativeName│      │
│ userType     │       │ licenseNumber    │       │ phone            │       │
│ isVerified   │       │ experienceYears  │       │ prefecture       │       │
└──────────────┘       │ licenseFilePath  │       │ city             │       │
                       │ registrationFile │       └──────────────────┘       │
                       │ verificationStatus│                                 │
                       └──────────────────┘                                 │
                                │                                            │
                                │                                            │
                       ┌────────▼──────────┐                                │
                       │  JobApplications  │                                │
                       ├───────────────────┤                                │
                       │ id (PK)           │                                │
                       │ pharmacistId (FK) │                                │
                       │ jobPostingId (FK) │◄───────────────────────────────┘
                       │ status            │                ┌───────────────┐
                       │ coverLetter       │                │  JobPostings  │
                       └───────────────────┘                ├───────────────┤
                                │                           │ id (PK)       │
                                │                           │ pharmacyId(FK)│
                       ┌────────▼──────────┐                │ title         │
                       │  WorkContracts    │                │ hourlyRate    │
                       ├───────────────────┤                │ dailyRate     │
                       │ id (PK)           │                │ scheduledWork │
                       │ applicationId(FK) │                │ Days          │
                       │ pharmacyId (FK)   │                └───────────────┘
                       │ pharmacistId (FK) │
                       │ status            │
                       │ dailyRate         │
                       │ scheduledWorkDays │
                       └───────────────────┘
                                │
                                │
                       ┌────────▼──────────┐
                       │  WorkSchedules    │
                       ├───────────────────┤
                       │ id (PK)           │
                       │ contractId (FK)   │
                       │ workDate          │
                       │ scheduledStartTime│
                       │ scheduledEndTime  │
                       │ breakTimeMinutes  │
                       └───────────────────┘
```

---

### 主要テーブル詳細

#### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL, -- 'pharmacist' or 'pharmacy'
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

#### PharmacistProfile

```sql
CREATE TABLE pharmacist_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  first_name_kana VARCHAR(50),
  last_name_kana VARCHAR(50),
  birth_date DATE,
  gender VARCHAR(10),
  phone VARCHAR(20),
  postal_code VARCHAR(10),
  prefecture VARCHAR(20),
  city VARCHAR(50),
  address VARCHAR(255),
  nearest_station VARCHAR(100),
  license_number VARCHAR(50),
  license_issued_date DATE,
  graduation_university VARCHAR(100),
  graduation_year INTEGER,
  experience_years INTEGER,
  specialties TEXT[],
  bio TEXT,

  -- 証明書ファイル
  license_file_path VARCHAR(500),
  registration_file_path VARCHAR(500),
  license_uploaded_at TIMESTAMPTZ,
  registration_uploaded_at TIMESTAMPTZ,

  -- 本人確認
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### JobPostings

```sql
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacy_profiles(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  prefecture VARCHAR(20),
  city VARCHAR(50),
  hourly_rate INTEGER,
  daily_rate INTEGER,
  work_hours_start TIME,
  work_hours_end TIME,
  break_time_minutes INTEGER,

  -- スケジュール情報
  scheduled_work_days VARCHAR(10)[], -- ['0','1','2',...] 日曜=0
  suggested_start_date DATE,
  contract_duration_days INTEGER,

  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### WorkContracts

```sql
CREATE TABLE work_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES job_applications(id),
  pharmacy_id UUID REFERENCES pharmacy_profiles(id),
  pharmacist_id UUID REFERENCES pharmacist_profiles(id),
  start_date DATE,
  end_date DATE,
  hourly_rate INTEGER,
  daily_rate INTEGER,
  scheduled_work_days VARCHAR(10)[], -- JobPostingからコピー
  work_hours_start TIME,
  work_hours_end TIME,
  terms TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### WorkSchedules

```sql
CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES work_contracts(id),
  work_date DATE NOT NULL,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  break_time_minutes INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 使い方・テスト方法

### 🚀 セットアップ

#### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd pharmacy-platform
```

#### 2. 依存関係のインストール

**フロントエンド:**

```bash
npm install
```

**バックエンド:**

```bash
cd backend
npm install
```

#### 3. 環境変数の設定

**フロントエンド (.env.local):**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**バックエンド (backend/.env):**

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/pharmacy_db

# JWT
JWT_SECRET=your-secret-key-here

# メール（任意）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

#### 4. データベースのセットアップ

```bash
# Prisma Clientを生成
npx prisma generate

# マイグレーション実行（ローカルDB接続時）
npx prisma migrate dev
```

#### 5. サーバーの起動

**バックエンド:**

```bash
cd backend
npm start
# → http://localhost:3001
```

**フロントエンド:**

```bash
npm run dev
# → http://localhost:3000
```

---

### 🧪 テスト手順

#### 1. ユーザー登録・ログイン

**薬剤師として登録:**

1. http://localhost:3000/auth/register にアクセス
2. 「薬剤師として登録」を選択
3. メール、パスワード、氏名を入力
4. 登録完了後、自動でログイン

**薬局として登録:**

1. http://localhost:3000/auth/register にアクセス
2. 「薬局として登録」を選択
3. メール、パスワードを入力
4. 登録完了後、自動でログイン

---

#### 2. 証明書アップロード機能のテスト

**前提条件:** 薬剤師としてログイン

**手順:**

1. 薬剤師ダッシュボードにアクセス
2. 左メニューから「アカウント設定」をクリック
3. 「📄 資格証明書」セクションに移動
4. 「薬剤師免許証」の「ファイルを選択」をクリック
5. 画像ファイル（JPG/PNG）を選択
6. 自動圧縮が実行され、アップロード完了
7. 同様に「保険薬剤師登録票」もアップロード

**確認ポイント:**

- ✅ アップロード中に「圧縮してアップロード中...」と表示される
- ✅ アップロード完了後、ファイル情報が表示される
- ✅ 本人確認ステータスが「⏳ 本人確認待ち」になる
- ✅ 再アップロードボタンが表示される
- ✅ 削除ボタンが表示される

---

#### 3. 運営管理画面のテスト

**アクセス方法:**

```
http://localhost:3000/admin/pharmacists
```

**手順:**

1. 運営管理画面にアクセス
2. 統計情報を確認（全体数、未確認数など）
3. ステータスフィルターで「未確認」を選択
4. 証明書をアップロードした薬剤師を探す
5. 「👁」アイコンをクリックして詳細表示
6. 「ファイルを表示」ボタンで証明書を確認
7. 「✅ 承認する」ボタンをクリック
8. 確認ダイアログで「OK」
9. 承認完了メッセージを確認

**確認ポイント:**

- ✅ 統計情報が正しく表示される
- ✅ フィルター・検索が機能する
- ✅ 証明書ファイルが閲覧できる
- ✅ 承認後、ステータスが「✅ 承認済み」に変わる
- ✅ 承認日時が記録される

**却下のテスト:**

1. 詳細画面で「❌ 却下する」をクリック
2. 却下理由を入力（必須）
3. 「却下する」ボタンをクリック
4. ステータスが「❌ 却下」に変わることを確認

---

#### 4. プロフィール編集機能のテスト

**前提条件:** 薬剤師としてログイン

**手順:**

1. 薬剤師ダッシュボード > アカウント設定
2. 「プロフィール情報」セクションに移動
3. 「編集する」ボタンをクリック
4. 各フィールドを編集:
   - 電話番号を入力
   - 住所情報を入力
   - 経験年数を更新
   - 自己紹介を記入
5. 「保存する」ボタンをクリック
6. 成功メッセージを確認
7. 編集モードが終了し、更新された情報が表示される

**確認ポイント:**

- ✅ 編集モードと表示モードが切り替わる
- ✅ 必須項目が空の場合、保存ボタンが無効になる
- ✅ 保存後、即座に更新内容が反映される
- ✅ キャンセルボタンで変更が破棄される

---

#### 5. 求人掲載・応募フローのテスト

**薬局側:**

1. 薬局ダッシュボード > 募集掲載
2. 「新規募集を作成」をクリック
3. 求人情報を入力:
   - タイトル
   - 日給: 20000 円
   - 契約期間: 30 日
   - 勤務予定曜日: 月〜金を選択
   - 希望開始日: 来月の日付を選択
4. 「掲載する」をクリック
5. 求人が一覧に表示されることを確認

**薬剤師側:**

1. 薬剤師ダッシュボード > 薬局募集への応募
2. 掲載された求人を検索
3. 求人詳細を表示
4. 応募理由を記入
5. 「応募する」をクリック
6. 応募完了メッセージを確認

---

#### 6. メッセージ機能のテスト

**前提条件:** 薬剤師が求人に応募済み

**薬局側:**

1. 薬局ダッシュボード > メッセージ
2. 応募した薬剤師とのスレッドを選択
3. メッセージを入力して送信
4. 送信したメッセージが表示されることを確認

**薬剤師側:**

1. 薬剤師ダッシュボード > メッセージ
2. 未読カウントが増えていることを確認
3. スレッドを開く
4. 受信したメッセージを確認
5. 返信を送信

---

#### 7. 契約・スケジュール機能のテスト

**薬局側（契約書送信）:**

1. 薬局ダッシュボード > 契約管理
2. 「契約書を送信」をクリック
3. 契約内容を入力:
   - 開始日
   - 終了日
   - 時給または日給
   - 勤務時間
   - 勤務通知事項
4. 「送信する」をクリック

**薬剤師側（契約承認）:**

1. 薬剤師ダッシュボード > 契約管理
2. 「承認待ち」タブを表示
3. 契約内容を確認
4. 「承認する」をクリック
5. 承認完了メッセージを確認

**スケジュール自動生成の確認:**

1. 薬剤師ダッシュボード > 出勤予定カレンダー
2. カレンダーに勤務日が青色でハイライトされることを確認
3. 勤務日をクリックして詳細を表示
4. 自動生成されたスケジュール情報を確認:
   - 勤務日
   - 勤務時間
   - 休憩時間
   - 「契約承認時に自動作成」のメモ

**薬局側でもスケジュール確認:**

1. 薬局ダッシュボード > 勤務スケジュール管理
2. 契約を選択
3. カレンダーに勤務日が表示されることを確認

---

### 📊 動作確認チェックリスト

#### 認証機能

- [ ] 薬剤師として新規登録できる
- [ ] 薬局として新規登録できる
- [ ] ログインできる
- [ ] ログアウトできる
- [ ] 未ログイン時、保護されたページにアクセスするとログイン画面にリダイレクトされる

#### 証明書アップロード機能

- [ ] 画像ファイル（JPG/PNG）をアップロードできる
- [ ] PDF ファイルをアップロードできる
- [ ] アップロード時に自動圧縮が実行される
- [ ] アップロード後、ファイル情報が表示される
- [ ] 再アップロードできる
- [ ] 証明書を削除できる
- [ ] 本人確認ステータスが表示される

#### 運営管理機能

- [ ] 薬剤師一覧が表示される
- [ ] 統計情報が正しく表示される
- [ ] ステータスフィルターが機能する
- [ ] 検索機能が機能する
- [ ] 薬剤師詳細が表示される
- [ ] 証明書を閲覧できる
- [ ] 本人確認を承認できる
- [ ] 本人確認を却下できる（理由必須）
- [ ] ステータスをリセットできる

#### プロフィール編集機能

- [ ] 薬剤師プロフィールを表示できる
- [ ] 薬剤師プロフィールを編集できる
- [ ] 編集内容を保存できる
- [ ] 編集をキャンセルできる
- [ ] 必須項目のバリデーションが機能する

#### 求人・応募機能

- [ ] 薬局が求人を掲載できる
- [ ] 薬剤師が求人を検索できる
- [ ] 薬剤師が求人に応募できる
- [ ] 薬局が応募を確認できる

#### メッセージ機能

- [ ] メッセージスレッドが表示される
- [ ] メッセージを送信できる
- [ ] 未読カウントが表示される
- [ ] メッセージを既読にできる

#### 契約・スケジュール機能

- [ ] 薬局が契約書を送信できる
- [ ] 薬剤師が契約を承認できる
- [ ] 契約承認時にスケジュールが自動生成される
- [ ] カレンダーに勤務日が表示される
- [ ] スケジュール詳細が表示される
- [ ] 月間ビューと週間ビューを切り替えられる

---

## 今後の拡張予定

### 🔜 短期（1-2 週間）

#### 1. データベースマイグレーション実行

- [ ] ローカル DB 接続の確立
- [ ] Prisma マイグレーションの実行
- [ ] 証明書関連フィールドの追加確認

#### 2. 運営者権限の実装

- [ ] `admin`ユーザータイプの追加
- [ ] 運営管理画面へのアクセス制限強化
- [ ] 運営者ダッシュボードの作成

#### 3. エラーハンドリングの改善

- [ ] フロントエンドでの詳細なエラー表示
- [ ] バックエンドでの包括的なエラーログ
- [ ] ユーザーフレンドリーなエラーメッセージ

---

### 📅 中期（1-2 ヶ月）

#### 1. 通知機能

- [ ] メール通知
  - 応募受信通知
  - 契約書受信通知
  - 契約承認通知
- [ ] プッシュ通知（PWA 対応）
- [ ] アプリ内通知センター

#### 2. 評価・レビュー機能

- [ ] 勤務終了後の相互評価
- [ ] 5 段階評価システム
- [ ] コメント機能
- [ ] 評価の統計表示

#### 3. 支払い・請求機能

- [ ] 報酬計算の自動化
- [ ] 請求書生成
- [ ] 支払いステータス管理
- [ ] 月次レポート

#### 4. カレンダー機能の拡張

- [ ] スケジュールの手動編集（承認フロー付き）
- [ ] 複数契約の統合ビュー
- [ ] カレンダーエクスポート（iCal 形式）
- [ ] リマインダー機能

---

### 🚀 長期（3-6 ヶ月）

#### 1. モバイルアプリ化

- [ ] React Native でのモバイルアプリ開発
- [ ] iOS/Android ネイティブアプリ
- [ ] オフライン対応
- [ ] カメラ統合（証明書撮影）

#### 2. AI 機能

- [ ] 求人と薬剤師の自動マッチング
- [ ] レコメンデーション機能
- [ ] 需要予測
- [ ] チャットボット（FAQ 対応）

#### 3. 分析・レポート機能

- [ ] 薬局向けダッシュボード
  - 応募率の分析
  - 契約成立率
  - 地域別統計
- [ ] 薬剤師向けダッシュボード
  - 勤務実績
  - 収入統計
  - スキル分析

#### 4. 外部連携

- [ ] 電子薬歴システム連携
- [ ] 会計ソフト連携
- [ ] カレンダーアプリ連携（Google Calendar 等）
- [ ] LINE 連携（メッセージ通知）

#### 5. セキュリティ強化

- [ ] 2 段階認証（2FA）
- [ ] IP アドレス制限（運営管理画面）
- [ ] 監査ログ
- [ ] データ暗号化の強化

---

### 💡 検討中の機能

#### 業務管理機能

- シフト希望の登録
- 休暇申請
- 勤務変更依頼
- 代理勤務の手配

#### コミュニティ機能

- 薬剤師向け掲示板
- Q&A フォーラム
- 勉強会・セミナー情報

#### マッチング精度向上

- 薬剤師のスキルタグ
- 薬局の要求スキル
- 適性マッチングアルゴリズム

---

## 📝 開発メモ

### 既知の問題

#### 1. データベースマイグレーション

**状況:** Prisma Accelerate 使用のため、直接マイグレーションが実行できない  
**対応:**

- `npx prisma generate`でクライアントは生成済み
- 証明書関連フィールドは手動追加が必要
- または直接 DB 接続の設定

**解決方法:**

```sql
-- 手動で実行するSQL
ALTER TABLE pharmacist_profiles
ADD COLUMN license_file_path VARCHAR(500),
ADD COLUMN registration_file_path VARCHAR(500),
ADD COLUMN license_uploaded_at TIMESTAMPTZ,
ADD COLUMN registration_uploaded_at TIMESTAMPTZ,
ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN verified_by UUID,
ADD COLUMN verified_at TIMESTAMPTZ,
ADD COLUMN verification_notes TEXT;
```

#### 2. ファイルストレージ

**現状:** ローカルファイルシステムに保存  
**課題:** 本番環境ではスケールしない  
**解決策:** S3 等のクラウドストレージへの移行を検討

---

### パフォーマンス最適化

#### フロントエンド

- [ ] 画像の遅延読み込み（Lazy Loading）
- [ ] コンポーネントのメモ化（React.memo）
- [ ] 大きなリストの仮想化（react-window）
- [ ] バンドルサイズの最適化

#### バックエンド

- [ ] データベースクエリの最適化
- [ ] インデックスの追加
- [ ] キャッシング（Redis）
- [ ] ページネーション実装

---

## 🔒 セキュリティガイドライン

### 実装済み

- ✅ パスワードのハッシュ化（bcrypt）
- ✅ JWT 認証
- ✅ CORS 設定
- ✅ Helmet（セキュリティヘッダー）
- ✅ ファイルタイプバリデーション
- ✅ ファイルサイズ制限
- ✅ 認証必須エンドポイント
- ✅ 所有者チェック

### 追加予定

- [ ] レート制限（rate limiting）
- [ ] CSRF 保護
- [ ] XSS 対策の強化
- [ ] SQL インジェクション対策（Prisma 使用で基本対策済み）
- [ ] 定期的なセキュリティ監査

---

## 📚 参考資料

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### 使用ライブラリ

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev/)
- [react-calendar](https://github.com/wojtekmaj/react-calendar)
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
- [Multer](https://github.com/expressjs/multer)

---

## 👥 貢献者

- 開発者: [Your Name]
- プロジェクト開始日: 2025 年 11 月
- 最終更新: 2025 年 11 月 26 日

---

## 📄 ライセンス

このプロジェクトは非公開プロジェクトです。

---

## 📞 サポート

質問や問題がある場合は、以下の方法でご連絡ください：

- Issue Tracker: [GitHub Issues]
- Email: [support@example.com]

---

**最終更新:** 2025 年 11 月 26 日  
**バージョン:** 1.0.0  
**ステータス:** 開発中
