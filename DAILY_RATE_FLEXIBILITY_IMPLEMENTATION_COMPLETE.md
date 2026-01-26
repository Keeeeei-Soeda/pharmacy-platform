# 日給柔軟化・契約書改善 実装完了レポート

**実装日**: 2026年1月26日  
**実装内容**: 日給の柔軟性向上、勤務日数制限変更、契約情報記録強化

---

## ✅ 実装完了サマリー

### 1. 日給設定の柔軟化 ✅
- **変更前**: 25,000円固定（コード内ハードコード）
- **変更後**: 下限20,000円、上限なし（薬局が自由に設定可能）
- **バリデーション**: 20,000円未満の場合はアラート表示（フロント・バックエンド両方）

### 2. 勤務日数制限の変更 ✅
- **変更前**: 10日〜90日
- **変更後**: 15日〜90日
- **バリデーション**: 15日未満・90日超過の場合はエラー

### 3. 契約情報の記録強化 ✅
- `work_contracts.work_days_count`: 勤務日数を明確に記録
- `work_contracts.daily_rate`: 日給を記録
- `work_contracts.total_compensation`: 報酬総額を記録
- **データベース変更**: 不要（既存カラムを活用）

### 4. 契約書類の改善 ✅
- **請求書PDF**: 日給を動的に表示（固定値から可変に変更）
- **労働条件通知書PDF**: 日給・報酬総額・計算式を明記
- **薬局向け契約書PDF**: 今回は未実装（次フェーズで実装予定）

---

## 📦 変更ファイル一覧

### バックエンド（3ファイル）

#### 1. `backend/src/controllers/structuredMessageController.js` ✅
**変更内容**:
- リクエストボディから `dailyRate` を受け取る（139行目）
- バリデーション追加:
  - 日給 ≥ 20,000円（147-151行目）
  - 勤務日数 15〜90日（153-157行目）
- `DAILY_RATE` 定数を削除し、`dailyRate` 変数を使用
- 計算ロジックの変更: `dailyRate * workDays`
- 請求書PDF生成時に `dailyRate` を渡す

**主な変更箇所**:
```javascript
// 変更前
const DAILY_RATE = 25000;
const totalCompensation = DAILY_RATE * workDays;

// 変更後
if (!dailyRate || dailyRate < 20000) {
  return res.status(400).json({ 
    error: '日給は20,000円以上に設定してください' 
  });
}
const totalCompensation = dailyRate * workDays;
```

#### 2. `backend/src/utils/pdfGenerator.js` ✅
**変更内容**:
- **請求書PDF** (69-76行目):
  - 日給を固定値（25,000）から `invoiceData.dailyRate` に変更
  - 動的に表示: `（日給 ¥${invoiceData.dailyRate.toLocaleString()} × ${invoiceData.workDays}日）`

- **労働条件通知書PDF** (235-239行目):
  - 日給を動的に表示
  - 報酬総額を追加表示
  - 計算式を追加: `（日給 ¥XX,XXX × XX日）`

**変更例**:
```javascript
// 請求書PDF
doc.text(`（日給 ¥${invoiceData.dailyRate.toLocaleString()} × ${invoiceData.workDays}日）`, col1X + 20, rowY);

// 労働条件通知書PDF
doc.text(`   日給: ¥${noticeData.dailyRate ? noticeData.dailyRate.toLocaleString() : '25,000'}`)
   .text(`   報酬総額: ¥${noticeData.totalCompensation ? noticeData.totalCompensation.toLocaleString() : (noticeData.dailyRate * noticeData.workDays).toLocaleString()}`)
   .text(`   （日給 ¥${noticeData.dailyRate ? noticeData.dailyRate.toLocaleString() : '25,000'} × ${noticeData.workDays}日）`)
```

#### 3. `backend/src/controllers/contractController.js` ✅
**変更内容**:
- 労働条件通知書PDF生成時に `dailyRate` と `totalCompensation` を追加で渡す（235-249行目）

---

### フロントエンド（3ファイル）

#### 1. `app/pharmacy/dashboard/page.tsx` ✅
**変更内容**:

**State の変更** (129-136行目):
```typescript
const [offerData, setOfferData] = useState({
  initialWorkDate: '',
  workDays: 15,         // 10 → 15に変更
  dailyRate: 20000,     // 新規追加
  workHours: '9:00-18:00',
  paymentDeadline: ''
});
```

**バリデーション追加** (527-563行目):
```typescript
// 日給のバリデーション
if (offerData.dailyRate < 20000) {
  alert('日給は20,000円以上に設定してください');
  return;
}

// 勤務日数のバリデーション
if (offerData.workDays < 15 || offerData.workDays > 90) {
  alert('勤務日数は15日〜90日の範囲で設定してください');
  return;
}
```

**正式オファーモーダルUI** (1188-1321行目):
- 日給入力フィールド追加:
  ```tsx
  <input 
    type="number"
    value={offerData.dailyRate}
    onChange={(e) => {
      const value = parseInt(e.target.value) || 20000;
      if (value < 20000) {
        alert('日給は20,000円以上に設定してください');
        return;
      }
      setOfferData({...offerData, dailyRate: value});
    }}
    min="20000"
    step="1000"
  />
  ```

- 勤務日数の下限を15日に変更:
  ```tsx
  <input 
    type="number"
    value={offerData.workDays}
    onChange={(e) => setOfferData({...offerData, workDays: parseInt(e.target.value) || 15})}
    min="15"  // 10 → 15に変更
    max="90"
  />
  ```

- 報酬総額の計算ボックス:
  - 固定値（25,000円）から可変値（offerData.dailyRate）に変更
  - リアルタイム計算表示

**表示内容**:
```
日給: ¥20,000
勤務日数: 15日
────────────────
報酬総額: ¥300,000
プラットフォーム手数料（40%）: ¥120,000
```

#### 2. `lib/api/structuredMessages.ts` ✅
**変更内容**:

**型定義の追加** (1-15行目):
```typescript
export interface MessageData {
  // ... 既存フィールド
  dailyRate?: number; // 追加
  // ...
}
```

**型定義の追加** (17-34行目):
```typescript
export interface StructuredMessage {
  // ... 既存フィールド
  dailyRate?: number | null; // 追加
  // ...
}
```

**型定義の追加** (45-52行目):
```typescript
export interface SendFormalOfferData {
  applicationId: number;
  initialWorkDate: string;
  workDays: number;
  dailyRate: number; // 追加: 日給（20,000円以上）
  workHours: string;
  paymentDeadline: string;
}
```

#### 3. `app/pharmacist/dashboard/page.tsx` ✅
**変更内容**:
- 正式オファー表示部分（978-1032行目あたり）に日給を追加表示
- 報酬総額の計算式を表示

**表示内容**:
```tsx
<div className="flex justify-between">
  <span className="text-gray-600">日給:</span>
  <span className="font-medium">¥{msg.dailyRate?.toLocaleString() || '25,000'}</span>
</div>
<div className="flex justify-between border-t border-gray-200 pt-2">
  <span className="text-gray-800 font-medium">報酬総額:</span>
  <span className="font-bold text-blue-600">¥{msg.totalCompensation?.toLocaleString()}</span>
</div>
<p className="text-xs text-gray-500">
  （日給 ¥{msg.dailyRate?.toLocaleString() || '25,000'} × {msg.workDays}日）
</p>
```

---

## 🔍 データの流れ

### 1. 正式オファー送信
```
薬局側フロントエンド
  ↓ 日給入力（20,000円〜）、勤務日数（15〜90日）
バックエンド
  ↓ バリデーション
  ↓ 報酬総額 = dailyRate × workDays
  ↓ 手数料 = 報酬総額 × 40%
データベース
  ↓ work_contracts.daily_rate = 入力された日給
  ↓ work_contracts.work_days_count = 勤務日数
  ↓ work_contracts.total_compensation = 報酬総額
```

### 2. PDF生成
```
請求書PDF
  ↓ 日給: ¥XX,XXX（可変）
  ↓ 勤務日数: XX日
  ↓ 報酬総額: ¥XXX,XXX
  ↓ 手数料: ¥XXX,XXX（40%）

労働条件通知書PDF
  ↓ 日給: ¥XX,XXX（可変）
  ↓ 報酬総額: ¥XXX,XXX
  ↓ 計算式: （日給 ¥XX,XXX × XX日）
```

---

## ✅ 実装チェックリスト

### バックエンド
- [x] `structuredMessageController.js` - 日給受取処理追加
- [x] `structuredMessageController.js` - バリデーション追加（日給 ≥ 20,000円）
- [x] `structuredMessageController.js` - バリデーション追加（勤務日数 15〜90日）
- [x] `pdfGenerator.js` - 請求書の日給を動的表示
- [x] `pdfGenerator.js` - 労働条件通知書の日給・報酬総額を動的表示
- [x] `contractController.js` - 労働条件通知書生成時のデータ追加
- [ ] データベースマイグレーション（不要）

### フロントエンド
- [x] `app/pharmacy/dashboard/page.tsx` - 日給入力フィールド追加
- [x] `app/pharmacy/dashboard/page.tsx` - 日給バリデーション追加
- [x] `app/pharmacy/dashboard/page.tsx` - 勤務日数下限を15日に変更
- [x] `app/pharmacy/dashboard/page.tsx` - State・ハンドラー修正
- [x] `app/pharmacist/dashboard/page.tsx` - 正式オファー表示の日給を動的化
- [x] `lib/api/structuredMessages.ts` - 型定義更新（dailyRate追加）
- [ ] `lib/api/index.ts` - WorkContract型定義更新（次回実装予定）

### 未実装（次フェーズ）
- [ ] 薬局向け契約書PDF生成機能
- [ ] 薬局向け契約書ダウンロードボタン追加
- [ ] データベースに `pharmacy_contract_url` カラム追加

---

## 🔍 動作確認項目

### バックエンド
- [ ] POST `/api/structured-messages/formal-offer` で日給19,999円を送信 → エラー400が返る
- [ ] POST `/api/structured-messages/formal-offer` で日給20,000円を送信 → 成功
- [ ] POST `/api/structured-messages/formal-offer` で勤務日数14日を送信 → エラー400が返る
- [ ] POST `/api/structured-messages/formal-offer` で勤務日数15日を送信 → 成功
- [ ] 請求書PDFに日給が正しく表示される
- [ ] 労働条件通知書PDFに日給・報酬総額が正しく表示される

### フロントエンド
- [ ] 薬局ダッシュボード - 正式オファーモーダルで日給入力フィールドが表示される
- [ ] 日給20,000円未満を入力するとアラートが表示される
- [ ] 勤務日数15日未満を入力するとエラーが表示される
- [ ] 報酬総額が自動計算される（日給 × 勤務日数）
- [ ] プラットフォーム手数料が自動計算される（報酬総額 × 40%）
- [ ] 薬剤師ダッシュボード - 正式オファー表示で日給が表示される
- [ ] 薬剤師ダッシュボード - 報酬総額の計算式が表示される

---

## 📊 テストシナリオ

### シナリオ1: 日給20,000円、勤務日数15日
**入力**:
- 初回出勤日: 2026年2月10日
- 日給: 20,000円
- 勤務日数: 15日
- 勤務時間: 9:00-18:00
- 支払い期限: 2026年2月7日

**期待される結果**:
- 報酬総額: 300,000円
- プラットフォーム手数料: 120,000円（40%）
- データベースに正しく保存される
- 請求書PDFに「日給 ¥20,000 × 15日」と表示される

### シナリオ2: 日給25,000円、勤務日数30日（従来の設定）
**入力**:
- 初回出勤日: 2026年2月18日
- 日給: 25,000円
- 勤務日数: 30日
- 勤務時間: 9:00-18:00
- 支払い期限: 2026年2月15日

**期待される結果**:
- 報酬総額: 750,000円
- プラットフォーム手数料: 300,000円（40%）
- データベースに正しく保存される
- 請求書PDFに「日給 ¥25,000 × 30日」と表示される

### シナリオ3: バリデーションエラー
**入力1**:
- 日給: 19,999円 → エラー「日給は20,000円以上に設定してください」

**入力2**:
- 勤務日数: 14日 → エラー「勤務日数は15日〜90日の範囲で設定してください」

**入力3**:
- 勤務日数: 91日 → エラー「勤務日数は15日〜90日の範囲で設定してください」

---

## 📝 次のステップ（未実装機能）

### 薬局向け契約書PDF生成（優先度: 中）
**内容**:
1. `backend/src/utils/pdfGenerator.js` に `generatePharmacyContractPDF` 関数を追加
2. 薬剤師が承諾した時点で契約書PDFを自動生成
3. `work_contracts` テーブルに `pharmacy_contract_url` カラムを追加
4. 薬局ダッシュボードにダウンロードボタンを追加

**含める内容**:
- タイトル: 薬剤師体験期間 契約書
- 薬局情報（薬局名、所在地）
- 薬剤師情報（氏名 ※手数料支払い後に開示）
- 契約内容:
  - 初回出勤日
  - 勤務日数
  - 日給
  - 報酬総額
  - 勤務時間
  - プラットフォーム手数料
  - 支払い条件
  - その他の条件
- 署名欄

---

## 🎉 まとめ

### 実装完了した機能
✅ **日給の柔軟化**:
- 薬局が日給を自由に設定可能（下限20,000円）
- バリデーションによる入力制限

✅ **勤務日数制限の変更**:
- 10日〜90日 → 15日〜90日に変更

✅ **契約情報の記録強化**:
- 日給、勤務日数、報酬総額をデータベースに記録

✅ **契約書類の改善**:
- 請求書PDFに日給を動的表示
- 労働条件通知書PDFに日給・報酬総額・計算式を明記

### 実装していない機能
- 薬局向け契約書PDF生成（次フェーズで実装予定）
- 薬局向け契約書ダウンロードUI

### 変更ファイル数
- **バックエンド**: 3ファイル
- **フロントエンド**: 3ファイル
- **合計**: 6ファイル

### 後方互換性
- 既存の契約データには影響なし
- 新規契約から柔軟な日給設定が適用される

---

**実装完了日**: 2026年1月26日  
**実装者**: AI Assistant  
**所要時間**: 約2時間  
**次のアクション**: テスト・動作確認、VPSへのデプロイ

---

## 🚀 デプロイ手順

### 1. ローカルテスト
```bash
# バックエンド
cd backend
npm run dev

# フロントエンド
npm run dev
```

### 2. VPSデプロイ
```bash
# バックエンドのアップロード
scp -r backend/src/controllers/structuredMessageController.js root@162.43.8.168:/root/pharmacy-platform/backend/src/controllers/
scp -r backend/src/utils/pdfGenerator.js root@162.43.8.168:/root/pharmacy-platform/backend/src/utils/
scp -r backend/src/controllers/contractController.js root@162.43.8.168:/root/pharmacy-platform/backend/src/controllers/

# フロントエンドのアップロード
scp -r app/pharmacy/dashboard/page.tsx root@162.43.8.168:/root/pharmacy-platform/app/pharmacy/dashboard/
scp -r app/pharmacist/dashboard/page.tsx root@162.43.8.168:/root/pharmacy-platform/app/pharmacist/dashboard/
scp -r lib/api/structuredMessages.ts root@162.43.8.168:/root/pharmacy-platform/lib/api/

# SSH接続
ssh root@162.43.8.168

# バックエンド再起動
cd /root/pharmacy-platform/backend
pm2 restart pharmacy-backend

# フロントエンドビルド&再起動
cd /root/pharmacy-platform
npm run build
pm2 restart pharmacy-frontend
```

---

これで日給柔軟化・契約書改善の実装が完了しました！🎉

