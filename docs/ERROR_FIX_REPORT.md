# エラー修正レポート - 2025 年 11 月 26-27 日

## 🔴 エラー 1: 薬剤師の新規登録ボタンを押して発生

### 発見されたエラー

**場所**: `lib/api/admin.ts (1:1)`, `lib/api/uploads.ts`

**症状**: トークンの保存場所の不整合

---

## 📋 問題の詳細

### 問題 1: localStorage のトークンキーの不整合

**発見内容:**

```typescript
// api-client.ts - トークンを保存
localStorage.setItem("auth_token", token); // ✅ 'auth_token'

// admin.ts - トークンを取得
const token = localStorage.getItem("token"); // ❌ 'token'

// uploads.ts - トークンを取得
const token = localStorage.getItem("token"); // ❌ 'token'
```

**影響:**

- 認証トークンが正しく取得できない
- API リクエストが認証エラーになる
- 証明書のアップロードやファイル表示が失敗する

---

### 問題 2: FormData のアップロード対応

**発見内容:**

`apiClient.post()` メソッドは `JSON.stringify()` を使用しているため、FormData を扱えない

```typescript
// api-client.ts の post メソッド
async post<T>(endpoint: string, data?: any): Promise<T> {
  return this.request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),  // ❌ FormDataは対応していない
  });
}
```

**影響:**

- 証明書（画像・PDF）のアップロードが失敗する
- FormData が JSON 文字列に変換されてしまう

---

## ✅ 実施した修正

### 修正 1: デフォルトエクスポートの追加

**`lib/api-client.ts` (120-127 行目)**

```typescript
// ❌ 修正前
export const apiClient = new ApiClient(API_BASE_URL);

// ✅ 修正後
const apiClient = new ApiClient(API_BASE_URL);

// Named export
export { apiClient };

// Default export
export default apiClient;
```

**問題:**

- `api-client.ts` が名前付きエクスポート（`export const`）のみ
- 他のファイルがデフォルトインポート（`import apiClient from`）を使用
- → モジュールが見つからないエラー

**影響を受けたファイル:**

- `lib/api/admin.ts`
- `lib/api/profiles.ts`
- `lib/api/schedules.ts`
- `lib/api/uploads.ts`

---

### 修正 2: トークンキーの統一

**`lib/api/admin.ts` (117 行目)**

```typescript
// ❌ 修正前
const token = localStorage.getItem("token");

// ✅ 修正後
const token = localStorage.getItem("auth_token");
```

**`lib/api/uploads.ts` (51 行目)**

```typescript
// ❌ 修正前
const token = localStorage.getItem("token");

// ✅ 修正後
const token = localStorage.getItem("auth_token");
```

---

### 修正 3: FormData アップロードの対応

**`lib/api/uploads.ts` (29-41 行目)**

```typescript
// ❌ 修正前
export async function uploadLicense(
  file: File,
  type: "license" | "registration"
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await apiClient.post("/uploads/license", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
```

```typescript
// ✅ 修正後
export async function uploadLicense(
  file: File,
  type: "license" | "registration"
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  // FormDataの場合は直接fetchを使用
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/api/uploads/license`,
    {
      method: "POST",
      headers,
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "アップロードに失敗しました");
  }

  const data = await response.json();
  return data;
}
```

**変更内容:**

1. `apiClient.post()` を使わず、直接 `fetch()` を使用
2. `auth_token` を localStorage から取得
3. Authorization ヘッダーを手動で追加
4. FormData をそのまま送信
5. エラーハンドリングを追加

---

## 🧪 修正後の動作確認

### 確認項目

- [x] トークンキーの統一（`auth_token`）
- [x] FormData アップロードの対応
- [x] エラーハンドリングの追加
- [x] **実際の動作テスト**

---

## 📝 修正ファイル一覧

| ファイル             | 修正内容                             | 行数    |
| -------------------- | ------------------------------------ | ------- |
| `lib/api-client.ts`  | デフォルトエクスポートを追加         | 120-127 |
| `lib/api/admin.ts`   | トークンキーを `auth_token` に変更   | 117     |
| `lib/api/uploads.ts` | トークンキーを `auth_token` に変更   | 51      |
| `lib/api/uploads.ts` | FormData アップロードを fetch に変更 | 29-68   |

---

## エラー 5: Prisma データベース接続エラー

### エラー詳細

**エラーメッセージ:**

```
Registration error: PrismaClientInitializationError:
User was denied access on the database `(not available)`
```

**発生場所:**

- `/backend/src/controllers/authController.js:63`
- Prisma Client がデータベースに接続できない

**原因:**

1. ❌ バックエンドフォルダに `.env` ファイルが存在しない
2. ❌ `DATABASE_URL` が設定されていない
3. ❌ Prisma Client が正しく生成されていない

### 修正内容

#### 1. バックエンドの `.env` ファイルを作成

**ファイル**: `/backend/.env`

```env
# データベース接続
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pharmacy_platform?schema=public"

# JWT設定
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# サーバー設定
PORT=3001
NODE_ENV=development

# CORS設定
FRONTEND_URL="http://localhost:3000"
```

#### 2. Prisma Client を生成

```bash
cd /Users/soedakei/pharmacy-platform
npx prisma generate
```

#### 3. プロフィール作成エラーハンドリングを追加

**ファイル**: `/backend/src/controllers/authController.js`

**変更箇所**: 60-86 行目

```javascript
// ユーザータイプに応じてプロフィールを自動作成
try {
  if (userType === "pharmacist") {
    // 薬剤師プロフィールを自動作成
    await prisma.pharmacistProfile.create({
      data: {
        userId: user.id,
        firstName: firstName || "名前",
        lastName: lastName || "姓",
        experienceYears: 0,
        specialties: [],
        hasDriversLicense: false,
        hasHomeCareExperience: false,
      },
    });
    console.log("Auto-created pharmacist profile for user:", user.id);
  } else if (userType === "pharmacy") {
    // 薬局プロフィールを自動作成
    await prisma.pharmacyProfile.create({
      data: {
        userId: user.id,
        pharmacyName: "薬局名未設定",
        prefecture: "都道府県未設定",
        city: "市区町村未設定",
      },
    });
    console.log("Auto-created pharmacy profile for user:", user.id);
  }
} catch (profileError) {
  console.error("Profile creation error:", profileError);
  console.log(
    "User created but profile creation failed. User can create profile later."
  );
  // プロフィール作成に失敗しても、ユーザー登録は成功とする
}
```

### 期待される効果

- ✅ ユーザー登録が成功する
- ⚠️ プロフィール作成は失敗する可能性（後で手動作成）
- ✅ ダッシュボードにリダイレクトされる

---

## アーカイブ: LINE 連携機能の除去

### 実施内容

**実施日**: 2025 年 11 月 26 日  
**理由**: 現時点で LINE 連携機能は不要と判断

### アーカイブしたファイル

#### Controllers

- ✅ `backend/src/controllers/lineAuthController.js`
- ✅ `backend/src/controllers/lineBotController.js`

#### Routes

- ✅ `backend/src/routes/lineAuth.js`
- ✅ `backend/src/routes/lineBot.js`

### 保管場所

```
backend/src/_archived/line/
├── README.md (復元手順とドキュメント)
├── controllers/
│   ├── lineAuthController.js
│   └── lineBotController.js
└── routes/
    ├── lineAuth.js
    └── lineBot.js
```

### 実施した変更

#### 1. ファイルのアーカイブ

```bash
# アーカイブディレクトリを作成
mkdir -p backend/src/_archived/line/controllers
mkdir -p backend/src/_archived/line/routes

# ファイルをコピー
cp backend/src/controllers/line*.js backend/src/_archived/line/controllers/
cp backend/src/routes/line*.js backend/src/_archived/line/routes/
```

#### 2. app.js からルートを削除

**ファイル**: `backend/src/app.js`

**削除した行**:

```javascript
app.use("/api/line-auth", require("./routes/lineAuth"));
app.use("/api/line", require("./routes/lineBot"));
```

#### 3. .env ファイルの更新

**ファイル**: `backend/.env`

**変更内容**: LINE 設定をコメントアウト

```env
# LINE Messaging API (アーカイブ済み - 将来の開発用)
# LINE_CHANNEL_ACCESS_TOKEN=""
# LINE_CHANNEL_SECRET=""
# LINE_LOGIN_CHANNEL_ID=""
# LINE_LOGIN_CHANNEL_SECRET=""
# LINE_LOGIN_CALLBACK_URL="http://localhost:3001/api/line/callback"
```

### 復元方法

将来 LINE 連携が必要になった場合は、以下のファイルを参照：

```
backend/src/_archived/line/README.md
```

このファイルに詳細な復元手順が記載されています。

### 期待される効果

- ✅ バックエンド起動時の "no channel access token" エラーが消える
- ✅ 不要なルートが削除され、コードがクリーンになる
- ✅ 将来の開発のためにコードは保管されている
- ✅ API のメンテナンスが簡素化される

---

### 追加修正: auth.js から LINE 参照を削除

**エラー内容:**

```
Error: Cannot find module '../controllers/lineAuthController'
Require stack:
- /Users/soedakei/pharmacy-platform/backend/src/routes/auth.js
```

**修正内容:**

**ファイル**: `backend/src/routes/auth.js`

**削除した行:**

```javascript
// インポート文
const lineAuthController = require("../controllers/lineAuthController");

// LINE認証ルート
router.get("/line", lineAuthController.getLoginUrl);
router.get("/line/callback", lineAuthController.handleCallback);

// デバッグエンドポイント
router.get("/debug", (req, res) => {
  res.json({
    channelId: process.env.LINE_LOGIN_CHANNEL_ID ? "Set" : "Not Set",
    channelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET ? "Set" : "Not Set",
    callbackUrl: process.env.LINE_LOGIN_CALLBACK_URL,
  });
});
```

**確認内容:**

- ✅ 他のファイルには LINE 関連の参照は存在しない
- ✅ LINE 関連コードはアーカイブディレクトリ内にのみ保管

---

## エラー 6: PostgreSQL 認証エラー

### エラー詳細

**エラーメッセージ:**

```
Database connection failed: error: role "postgres" does not exist
```

**発生場所:**

- バックエンド起動時
- データベース接続処理

**原因:**

`.env` ファイルで指定したデータベースユーザー「postgres」が存在しない

### 確認した情報

#### PostgreSQL の状態:

```bash
$ psql --version
psql (PostgreSQL) 15.14 (Homebrew)

$ psql -d pharmacy_platform -c "\du"
ロール一覧:
- soedakei (スーパーユーザー)
- pharmacy_user (一般ユーザー)
```

#### データベース一覧:

```
pharmacy_platform | soedakei | UTF8
```

### 修正内容

**ファイル**: `backend/.env`

**変更前:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pharmacy_platform?schema=public"
```

**変更後:**

```env
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public"
```

**変更点:**

- ✅ ユーザー名を `postgres` から `soedakei` に変更
- ✅ パスワードを削除（ローカル接続では不要）
- ✅ 既存のデータベース所有者を使用

### 期待される効果

- ✅ データベース接続が成功する
- ✅ バックエンドが正常に起動する
- ✅ Prisma Client がデータベースにアクセスできる

---

## エラー 7: 薬剤師ダッシュボード - Calendar 重複エラー

### エラー詳細

**エラーメッセージ:**

```
the name `Calendar` is defined multiple times
```

**発生場所:**

- `app/pharmacist/dashboard/page.tsx`

**原因:**

2 つの異なる Calendar が重複してインポートされている：

1. `import Calendar from 'react-calendar'` - カレンダーコンポーネント
2. `import { Calendar } from 'lucide-react'` - アイコン

### 修正内容

**ファイル**: `app/pharmacist/dashboard/page.tsx`

**変更前 (14-27 行目):**

```typescript
import {
  Search,
  FileText,
  Clock,
  Settings,
  Bell,
  LogOut,
  MapPin,
  DollarSign,
  Calendar,  // ← 重複！
  ...
} from 'lucide-react';
```

**変更後:**

```typescript
import {
  Search,
  FileText,
  Clock,
  Settings,
  Bell,
  LogOut,
  MapPin,
  DollarSign,
  Calendar as CalendarIcon,  // ← リネーム
  ...
} from 'lucide-react';
```

---

## エラー 8: 薬局ダッシュボード - Calendar 重複エラー

### エラー詳細

薬剤師ダッシュボードと同じエラーが薬局側でも発生

**発生場所:**

- `app/pharmacy/dashboard/page.tsx`

### 修正内容

**ファイル**: `app/pharmacy/dashboard/page.tsx`

薬剤師側と同様に、Lucide の `Calendar` を `CalendarIcon` にリネーム

---

## エラー 9: authController.js - 構文エラー（余分な閉じ括弧）

### エラー詳細

**問題:**

薬局プロフィール作成部分に余分な `}` があり、構文エラーが発生

**発生場所:**

- `backend/src/controllers/authController.js` (169 行目)

### 修正内容

**変更前:**

```javascript
    }  // ← 余分な閉じ括弧
    } catch (profileError) {
```

**変更後:**

```javascript
      }  // ← else if のための正しい閉じ括弧
    } catch (profileError) {
```

---

## エラー 10: authController.js - フォームデータの未使用

### エラー詳細

**問題:**

バックエンドがフロントエンドから送られた薬局情報（薬局名、電話番号、住所など）を使用せず、ハードコードされた値を保存していた

### 修正内容

**ファイル**: `backend/src/controllers/authController.js`

#### 1. リクエストボディからデータを取得

```javascript
const {
  email,
  password,
  userType,
  firstName,
  lastName,
  // 薬局用フィールド
  pharmacyName,
  phone,
  address,
  // 薬剤師用フィールド
  licenseNumber,
  experience,
} = req.body;
```

#### 2. 薬局プロフィール作成時に実際のデータを使用

```javascript
await prisma.pharmacyProfile.create({
  data: {
    userId: user.id,
    pharmacyName: pharmacyName || "薬局名未設定", // フォームの値を使用
    phone: phone || null,
    address: address || null,
    prefecture: prefecture, // 住所から抽出
    city: city,
  },
});
```

#### 3. 薬剤師プロフィールも同様に修正

- 経験年数の変換ロジックを追加
- 住所から都道府県と市区町村を抽出
- 免許番号などのフォーム値を使用

---

## エラー 11: Prisma データベースアクセス拒否（未解決）

### エラー詳細

**エラーメッセージ:**

```
PrismaClientInitializationError:
User was denied access on the database `(not available)`
```

**原因:**

Prisma Client がデータベースに接続できない、または権限がない

### 暫定対応

プロフィール作成部分を一時的にコメントアウトして、ユーザー登録を成功させる

**ファイル**: `backend/src/controllers/authController.js` (73-178 行目)

```javascript
// ユーザータイプに応じてプロフィールを自動作成
// 一時的に無効化：Prismaの接続問題を後で解決
/*
try {
  // プロフィール作成コード...
} catch (profileError) {
  // エラーハンドリング...
}
*/
console.log("Profile creation skipped - will be created manually later");
```

### 今後の対応

1. Prisma の DATABASE_URL 設定を確認
2. データベースユーザーの権限を確認
3. Prisma Client を再生成
4. プロフィール作成機能を有効化
5. 既存ユーザーのプロフィールを手動で作成

---

## エラー 12: 薬局ダッシュボード - 契約情報取得エラー

### エラー詳細

**エラーメッセージ:**

```
TypeError: undefined is not an object (evaluating 'response.contracts')
```

**発生場所:**

- `app/pharmacy/dashboard/page.tsx` (344 行目)

**原因:**

API レスポンスが `undefined` の可能性があるのに、オプショナルチェーンを使用していなかった

### 修正内容

**ファイル**: `app/pharmacy/dashboard/page.tsx`

**変更前:**

```typescript
const response = await getPharmacyContracts();
setContracts(response.contracts || []);
```

**変更後:**

```typescript
const response = await getPharmacyContracts();
setContracts(response?.contracts || []); // オプショナルチェーン追加
```

---

## ✅ 最終的な状態

### 成功していること

1. ✅ **薬剤師アカウントの登録とログイン**
2. ✅ **薬局アカウントの登録とログイン**
3. ✅ **薬剤師ダッシュボードへのアクセス**
4. ✅ **薬局ダッシュボードへのアクセス**
5. ✅ **JWT トークン認証**
6. ✅ **ダッシュボードへのリダイレクト**

### 残っている問題

1. ⚠️ **Prisma プロフィール作成が無効化されている**

   - ユーザー登録は成功するが、プロフィールは後で手動作成が必要

2. ⚠️ **ボタンの入れ子エラー（HTML 構造）**
   - 警告のみで機能には影響しない
   - 後で修正が必要

### テスト済みアカウント

#### 薬剤師

- `pharmacist1@test.com` / `Test1234!`
- `pharmacist2@test.com` / `Test1234!`
- `pharmacist3@test.com` / `Test1234!`

#### 薬局

- `pharmacy1@test.com` / `Test1234!`
- `pharmacy2@test.com` / `Test1234!`
- `pharmacy3@test.com` / `Test1234!`

---

## 🎯 2025 年 11 月 27 日のデバッグセッション - プロフィール機能完成

### エラー 13: Prisma スキーマとデータベースの不整合

**エラー詳細:**

```
PrismaClientKnownRequestError: The column `job_postings.scheduled_work_days` does not exist
```

**原因:**

- Prisma スキーマがデータベースの実際の構造と一致していない
- ルートの`.env`ファイルに間違った DATABASE_URL が設定されていた

**修正内容:**

1. **DATABASE_URL を正しく設定**

```bash
# ルートの.envを修正
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public"
```

2. **Prisma スキーマを同期**

```bash
cd /Users/soedakei/pharmacy-platform
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public" npx prisma db pull
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public" npx prisma generate
```

3. **プロフィール作成機能を有効化**

- `authController.js`のコメントアウトを解除
- プロフィール自動作成が正常に動作するように修正

**結果:**

- ✅ 新規登録時にプロフィールが自動作成されるようになった
- ✅ 薬剤師・薬局両方で正常に動作

---

### エラー 14: ダッシュボード UI 問題

#### 問題 14-1: メニュー名の混乱

**問題:**

- 「アカウント設定」メニューにプロフィール情報が含まれている
- ユーザーがプロフィール編集場所を見つけにくい

**修正内容:**

**ファイル**: `app/pharmacist/dashboard/page.tsx`

```typescript
// Before
type ActiveMenu = '募集検索' | 'メッセージ' | '契約管理' | '勤務中薬局' | '薬局情報' | '出勤予定' | '勤怠管理' | 'アカウント';

{ id: 'アカウント' as ActiveMenu, label: 'アカウント設定', icon: Settings }

// After
type ActiveMenu = '募集検索' | 'メッセージ' | '契約管理' | '勤務中薬局' | '薬局情報' | '出勤予定' | '勤怠管理' | 'プロフィール';

{ id: 'プロフィール' as ActiveMenu, label: 'プロフィール', icon: User }
```

**結果:**

- ✅ メニュー名が「プロフィール」に変更
- ✅ アイコンも Settings から User に変更

---

#### 問題 14-2: サイドバーにカレンダーが表示される

**問題:**

- サイドバーの「出勤予定カレンダー」メニュー項目の左側に、カレンダー全体が表示されている
- HTML を見ると、`<button>`の中に`<div class="react-calendar">...</div>`が入っている

**原因:**

```typescript
import Calendar from 'react-calendar';  // カレンダーコンポーネント
import { Calendar as CalendarIcon } from 'lucide-react';  // アイコン

// メニュー設定
{ id: '出勤予定', label: '出勤予定カレンダー', icon: Calendar }
//                                                    ^^^^^^^^
//                                                    react-calendarコンポーネント全体を参照！
```

**修正内容:**

**ファイル**: `app/pharmacist/dashboard/page.tsx`

```typescript
// Before
{ id: '出勤予定', label: '出勤予定カレンダー', icon: Calendar }

// After
{ id: '出勤予定', label: '出勤予定カレンダー', icon: CalendarIcon }
```

**結果:**

- ✅ サイドバーのカレンダーが消えた
- ✅ 小さなカレンダーアイコンが正しく表示される
- ✅ 「出勤予定カレンダー」メニューでカレンダーが正しく表示される

---

### エラー 15: API 404 エラー - `/api`プレフィックスの欠落

**エラー詳細:**

```
Failed to fetch profile: ApiError: Route not found
GET /pharmacists/profile → 404
```

**原因:**

- API エンドポイントに`/api`プレフィックスが欠けていた
- 正しいパス: `/api/pharmacists/profile`
- 間違ったパス: `/pharmacists/profile`

**修正内容:**

**ファイル**: `lib/api/profiles.ts`

```typescript
// Before
export async function getPharmacistProfile(): Promise<{
  profile: PharmacistProfile;
}> {
  const response = await apiClient.get("/pharmacists/profile");
  return response.data;
}

// After
export async function getPharmacistProfile(): Promise<{
  profile: PharmacistProfile;
}> {
  return await apiClient.get<{ profile: PharmacistProfile }>(
    "/api/pharmacists/profile"
  );
}
```

**修正したエンドポイント:**

1. ✅ `getPharmacistProfile`: `/pharmacists/profile` → `/api/pharmacists/profile`
2. ✅ `createPharmacistProfile`: `/pharmacists/profile` → `/api/pharmacists/profile`
3. ✅ `updatePharmacistProfile`: `/pharmacists/profile` → `/api/pharmacists/profile`
4. ✅ `getPharmacyProfile`: `/pharmacies/profile` → `/api/pharmacies/profile`
5. ✅ `createPharmacyProfile`: `/pharmacies/profile` → `/api/pharmacies/profile`
6. ✅ `updatePharmacyProfile`: `/pharmacies/profile` → `/api/pharmacies/profile`
7. ✅ `getLicenseInfo`: `/uploads/license/info` → `/api/uploads/license/info`

**結果:**

- ✅ プロフィール取得が成功するようになった
- ✅ 404 エラーが解消

---

### エラー 16: プロフィールデータが表示されない

**エラー詳細:**

データベースにはプロフィールが存在するのに、画面に「プロフィールを読み込んでいます...」と表示される

**原因:**

```typescript
// lib/api/profiles.ts
const response = await apiClient.get("/api/pharmacists/profile");
return response.data; // ← apiClient.get()は既にJSONパース済み！
// response = { profile: {...} }
// response.data = undefined
```

**修正内容:**

**ファイル**: `lib/api/profiles.ts`

```typescript
// Before
export async function getPharmacistProfile(): Promise<{
  profile: PharmacistProfile;
}> {
  const response = await apiClient.get("/api/pharmacists/profile");
  return response.data; // undefined が返される
}

// After
export async function getPharmacistProfile(): Promise<{
  profile: PharmacistProfile;
}> {
  return await apiClient.get<{ profile: PharmacistProfile }>(
    "/api/pharmacists/profile"
  );
  // { profile: {...} } が正しく返される
}
```

**結果:**

- ✅ プロフィール情報が正しく表示されるようになった
- ✅ 姓名、電話番号、免許番号などが表示される

---

### エラー 17: プロフィール保存後の即時更新問題

**エラー詳細:**

- プロフィールを編集して「保存する」をクリック
- データベースには正しく保存される
- **しかし、画面には古いデータが表示される**
- ページをリロードすると新しいデータが表示される

**原因:**

```typescript
const handleSaveProfile = async () => {
  const result = await updatePharmacistProfile(profileForm);
  setProfile(result.profile); // ← レスポンスのデータが古い可能性
  setIsEditingProfile(false);
};
```

**修正内容:**

**ファイル**: `app/pharmacist/dashboard/page.tsx`

```typescript
// Before
const handleSaveProfile = async () => {
  setIsSavingProfile(true);
  try {
    const result = await updatePharmacistProfile(profileForm);
    setProfile(result.profile); // 古いデータが表示される
    setIsEditingProfile(false);
    alert("プロフィールを更新しました");
  } catch (err) {
    console.error("Failed to save profile:", err);
    alert("プロフィールの更新に失敗しました");
  } finally {
    setIsSavingProfile(false);
  }
};

// After
const handleSaveProfile = async () => {
  setIsSavingProfile(true);
  try {
    await updatePharmacistProfile(profileForm);
    // 保存後にプロフィールを再取得して最新のデータを表示
    await fetchProfile();
    setIsEditingProfile(false);
    alert("プロフィールを更新しました");
  } catch (err) {
    console.error("Failed to save profile:", err);
    alert("プロフィールの更新に失敗しました");
  } finally {
    setIsSavingProfile(false);
  }
};
```

**結果:**

- ✅ 保存後すぐに最新データが表示される
- ✅ リロード不要で変更が反映される

---

### エラー 18: フォームの整理とフィールド削除

**要件:**

1. ❌ 削除: 番地・建物名（address）
2. ❌ 削除: 卒業大学（graduationUniversity）
3. ✅ 残す: 基本情報（姓名、カナ、電話番号、生年月日）
4. ✅ 残す: 住所情報（郵便番号、都道府県、市区町村、最寄駅）
5. ✅ 残す: 資格情報（免許番号、免許取得日、卒業年、実務経験年数、プロフィール文）

**修正内容:**

**ファイル**: `app/pharmacist/dashboard/page.tsx`

1. **番地・建物名フィールドを削除**

```typescript
// 削除された部分
<div>
  <label>番地・建物名</label>
  <input value={profileForm.address || ''} ... />
</div>
```

2. **卒業大学フィールドを削除**

```typescript
// 削除された部分
<div>
  <label>卒業大学</label>
  <input value={profileForm.graduationUniversity || ''} ... />
</div>
```

**結果:**

- ✅ 不要なフィールドが削除された
- ✅ フォームがシンプルになった
- ✅ ユーザーの要件に合致した表示項目

---

### エラー 19: パフォーマンス問題 - 複数回の API リクエスト

**エラー詳細:**

プロフィールメニューを開くと、`profile`API が**6 回**も呼ばれている

**原因:**

1. デバッグログによる再レンダリング
2. `fetchProfile`関数が毎回再作成される
3. useEffect が複数回実行される

**修正内容:**

**ファイル**: `app/pharmacist/dashboard/page.tsx`

1. **デバッグログを削除**

```typescript
// Before
const fetchProfile = async () => {
  console.log("🔍 fetchProfile: Starting...");
  const data = await getPharmacistProfile();
  console.log("✅ fetchProfile: Data received:", data);
  setProfile(data.profile);
  console.log("✅ fetchProfile: State updated");
};

// After
const fetchProfile = async () => {
  const data = await getPharmacistProfile();
  setProfile(data.profile);
};
```

2. **fetchProfile 関数を useCallback でメモ化**

```typescript
// Before
const fetchProfile = async () => {
  // 毎回新しい関数として作成される
};

// After
import { useState, useEffect, useCallback } from "react";

const fetchProfile = useCallback(async () => {
  // 一度だけ作成され、再利用される
}, []);
```

**結果:**

- ✅ プロフィール API が 1 回だけ呼ばれるようになった
- ✅ 保存時も 1 回の再取得のみ（PUT 1 回 + GET 1 回 = 合計 2 回）
- ✅ パフォーマンスが大幅に向上

---

## 📊 最終的な成果物

### ✅ 完成した機能

1. **ユーザー登録・ログイン機能** ✅

   - 薬剤師・薬局の新規登録
   - プロフィール自動作成
   - JWT 認証
   - ダッシュボードへのリダイレクト

2. **プロフィール機能** ✅

   - プロフィール表示
   - プロフィール編集
   - リアルタイム更新（リロード不要）
   - パフォーマンス最適化

3. **ダッシュボード UI** ✅
   - 直感的なメニュー名
   - 正しいアイコン表示
   - クリーンなレイアウト

### 📝 最終的な表示項目

#### 基本情報

- 姓・名
- 姓（カナ）・名（カナ）
- 電話番号
- 生年月日

#### 住所情報

- 郵便番号
- 都道府県
- 市区町村
- 最寄駅

#### 資格情報

- 薬剤師免許番号
- 免許取得日
- 卒業年
- 実務経験年数
- プロフィール文（自己紹介）

### 🎯 パフォーマンス指標

| 指標                            | Before | After | 改善       |
| ------------------------------- | ------ | ----- | ---------- |
| プロフィール取得 API リクエスト | 6 回   | 1 回  | 🟢 83%削減 |
| 保存後のリロード                | 必要   | 不要  | 🟢 UX 向上 |
| レスポンス時間                  | 遅い   | 速い  | 🟢 改善    |

---

## 🔧 修正されたファイル一覧

| ファイル                                    | 修正内容                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `backend/.env`                              | DATABASE_URL 修正                                                                      |
| `backend/src/controllers/authController.js` | プロフィール自動作成有効化                                                             |
| `lib/api/profiles.ts`                       | API 404 エラー修正、データ取得修正                                                     |
| `lib/api/uploads.ts`                        | API 404 エラー修正                                                                     |
| `app/pharmacist/dashboard/page.tsx`         | メニュー名変更、カレンダー問題修正、保存処理改善、フィールド削除、パフォーマンス最適化 |

---

## 🎓 学んだこと

1. **Prisma の正しい使い方**

   - DATABASE_URL の設定場所
   - スキーマ同期の重要性
   - Prisma Client の再生成

2. **React のベストプラクティス**

   - useCallback でパフォーマンス最適化
   - useEffect の依存配列の重要性
   - 状態管理の適切な方法

3. **API の設計**

   - エンドポイントの命名規則（/api プレフィックス）
   - レスポンス構造の一貫性
   - エラーハンドリング

4. **デバッグ手法**
   - ネットワークタブで API リクエストを確認
   - データベースで実際のデータを確認
   - コンソールログの効果的な使用

---

## エラー 20: サイドバーの名前表示が固定値

### エラー詳細

**問題:**

薬剤師ダッシュボードのサイドバー上部に表示されているユーザー名が「田中 花子」と固定されていた

**発生場所:**

- `app/pharmacist/dashboard/page.tsx` (2066 行目)

**原因:**

ユーザー名がハードコードされており、実際のプロフィールデータと連動していなかった

### 修正内容

**ファイル**: `app/pharmacist/dashboard/page.tsx`

**変更前:**

```typescript
<p className="text-sm text-gray-600">田中 花子</p>
```

**変更後:**

```typescript
<p className="text-sm text-gray-600">
  {profile ? `${profile.lastName} ${profile.firstName}` : "読み込み中..."}
</p>
```

**結果:**

- ✅ サイドバーに実際のユーザー名が表示される
- ✅ プロフィールデータが読み込まれるまで「読み込み中...」と表示

---

## エラー 21: 証明書アップロード機能の不具合

### エラー詳細

**問題 1: データベースカラムの欠落**

```
Unknown field `licenseFilePath` for select statement on model `PharmacistProfile`
```

**原因:**

バックエンドコードが参照している以下のカラムがデータベースに存在しなかった：

- `license_file_path`（薬剤師免許のファイルパス）
- `registration_file_path`（保険薬剤師登録票のファイルパス）
- `license_uploaded_at`（アップロード日時）
- `registration_uploaded_at`（アップロード日時）
- `verification_status`（検証ステータス）
- `verified_at`（検証日時）

**問題 2: ファイル形式判定の不正確さ**

PDF、JPG、PNG を受け付けるようになっていたが、ユーザー要件として**PDF 形式のみ**にする必要があった

### 修正内容

#### 1. データベースにカラムを追加

```sql
ALTER TABLE pharmacist_profiles
ADD COLUMN IF NOT EXISTS license_file_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS registration_file_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS license_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registration_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
```

#### 2. Prisma スキーマを同期

```bash
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public" npx prisma db pull
DATABASE_URL="postgresql://soedakei@localhost:5432/pharmacy_platform?schema=public" npx prisma generate
```

#### 3. ファイルフィルターを PDF 形式のみに変更

**ファイル**: `backend/src/controllers/uploadController.js`

**変更前:**

```javascript
const allowedExtensions = /\.(jpeg|jpg|png|pdf)$/i;
const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];
```

**変更後:**

```javascript
// PDF形式のみ許可
const allowedExtensions = /\.pdf$/i;
const allowedMimeTypes = ["application/pdf"];
```

**エラーメッセージ:**

```javascript
cb(
  new Error(
    "PDF形式のみアップロード可能です。JPGやPNGの場合は、PDFに変換してからアップロードしてください。"
  )
);
```

#### 4. バックエンドコードのフィールド名を修正

**ファイル**: `backend/src/controllers/uploadController.js`

Prisma スキーマとの整合性のため、フィールド名をスネークケースに統一：

```javascript
// Before
const fieldName =
  type === "license" ? "licenseFilePath" : "registrationFilePath";

// After
const fieldName =
  type === "license" ? "license_file_path" : "registration_file_path";
const uploadedAtFieldName =
  type === "license" ? "license_uploaded_at" : "registration_uploaded_at";
```

#### 5. フロントエンドの表示を更新

**ファイル**: `app/pharmacist/dashboard/page.tsx`

**変更前:**

```
JPG, PNG, PDF対応（最大10MB）
※画像は自動的に圧縮されます
```

**変更後:**

```
PDF形式のみ対応（最大10MB）
※JPGやPNGの場合は、PDFに変換してからアップロードしてください
```

**注意事項セクション:**

```
• PDF形式のみアップロード可能です（最大10MB）
• JPGやPNGの場合は、PDFに変換してからアップロードしてください
```

### 期待される効果

- ✅ PDF ファイルのみアップロード可能
- ✅ JPG、PNG ファイルは拒否される
- ✅ エラーメッセージで PDF 変換を促す
- ✅ データベースに証明書情報が正しく保存される

---

## 📊 最終的な成果物（2025 年 11 月 27 日時点）

### ✅ 完成した機能

1. **ユーザー登録・ログイン機能** ✅

   - 薬剤師・薬局の新規登録
   - プロフィール自動作成
   - JWT 認証
   - ダッシュボードへのリダイレクト

2. **プロフィール機能** ✅

   - プロフィール表示（動的）
   - プロフィール編集
   - リアルタイム更新（リロード不要）
   - サイドバーにユーザー名を動的表示
   - パフォーマンス最適化

3. **証明書アップロード機能** ✅

   - PDF 形式のみ受け付け
   - 薬剤師免許証アップロード
   - 保険薬剤師登録票アップロード
   - ファイル削除機能
   - アップロード状態の表示

4. **ダッシュボード UI** ✅
   - 直感的なメニュー名（「プロフィール」）
   - 正しいアイコン表示
   - クリーンなレイアウト
   - カレンダー問題の解決

### 📝 最終的な表示項目

#### 基本情報

- 姓・名
- 姓（カナ）・名（カナ）
- 電話番号
- 生年月日

#### 住所情報

- 郵便番号
- 都道府県
- 市区町村
- 最寄駅

#### 資格情報

- 薬剤師免許番号
- 免許取得日
- 卒業年
- 実務経験年数
- プロフィール文（自己紹介）

#### 証明書アップロード

- 薬剤師免許証（PDF 形式のみ）
- 保険薬剤師登録票（PDF 形式のみ）

### 🎯 パフォーマンス指標

| 指標                            | Before | After | 改善       |
| ------------------------------- | ------ | ----- | ---------- |
| プロフィール取得 API リクエスト | 6 回   | 1 回  | 🟢 83%削減 |
| 保存後のリロード                | 必要   | 不要  | 🟢 UX 向上 |
| レスポンス時間                  | 遅い   | 速い  | 🟢 改善    |

---

## 🔧 修正されたファイル一覧（全セッション）

| ファイル                                      | 修正内容                                                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `backend/.env`                                | DATABASE_URL 修正                                                                                                                |
| `backend/src/controllers/authController.js`   | プロフィール自動作成有効化                                                                                                       |
| `backend/src/controllers/uploadController.js` | ファイルフィルター修正（PDF 形式のみ）、フィールド名修正                                                                         |
| `lib/api/profiles.ts`                         | API 404 エラー修正、データ取得修正                                                                                               |
| `lib/api/uploads.ts`                          | API 404 エラー修正                                                                                                               |
| `app/pharmacist/dashboard/page.tsx`           | メニュー名変更、カレンダー問題修正、保存処理改善、フィールド削除、パフォーマンス最適化、サイドバー名表示、証明書アップロード表示 |

---

**作成日**: 2025 年 11 月 26-27 日  
**最終更新**: 2025 年 11 月 27 日  
**ステータス**: 基本機能完成、プロフィール機能完全動作、証明書アップロード機能完成
