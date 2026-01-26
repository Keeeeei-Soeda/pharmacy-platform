# 日給柔軟化・契約書改善 変更計画書

**作成日**: 2026年1月26日  
**変更目的**: 日給の柔軟性向上と契約関連書類の充実化

---

## 📋 変更内容サマリー

### 1. 日給設定方法の変更
- **現状**: 25,000円固定（コード内ハードコード）
- **変更後**: 下限20,000円、上限なし、薬局側が自由に設定可能
- **バリデーション**: 20,000円未満の場合はアラート表示

### 2. 勤務日数制限の変更
- **現状**: 10日〜90日
- **変更後**: 15日〜90日

### 3. 契約情報の記録強化
- 勤務日数
- 1日あたりの報酬額（日給）
- 報酬総額
を契約レコードに明確に記録

### 4. 契約書類の追加・改善
- **薬局向け**: 契約書PDF（新規作成）
- **薬剤師向け**: 労働条件通知書PDF（既存、改善）
- 両方に日数、日給、報酬総額を明記

---

## 🔍 影響範囲の分析

### Phase 1: データベース変更 ✅
**結論**: データベーススキーマの変更は不要

**理由**:
- `work_contracts.daily_rate`（日給）: 既存カラムを使用 ✅
- `work_contracts.work_days`（勤務日数配列）: 既存 ✅
- `work_contracts.work_days_count`（勤務日数）: 既存 ✅
- `work_contracts.total_compensation`（報酬総額）: 既存 ✅

すべて必要なカラムは既に存在しています。

---

### Phase 2: バックエンドAPI変更

#### 2-1. 構造化メッセージ（正式オファー送信）

**ファイル**: `backend/src/controllers/structuredMessageController.js`

**現在のコード**:
```javascript
// 173-177行目
const DAILY_RATE = 25000; // 日給固定：25,000円
const PLATFORM_FEE_RATE = 0.40; // プラットフォーム手数料：40%

const totalCompensation = DAILY_RATE * workDays; // 報酬総額
const platformFeeAmount = Math.floor(totalCompensation * PLATFORM_FEE_RATE); // 手数料（40%）
```

**変更後のロジック**:
```javascript
// リクエストボディから日給を受け取る
const { applicationId, initialWorkDate, workDays, dailyRate, workHours, paymentDeadline } = req.body;

// バリデーション
if (!dailyRate || dailyRate < 20000) {
  return res.status(400).json({ 
    error: '日給は20,000円以上に設定してください' 
  });
}

if (workDays < 15 || workDays > 90) {
  return res.status(400).json({ 
    error: '勤務日数は15日〜90日の範囲で設定してください' 
  });
}

const PLATFORM_FEE_RATE = 0.40; // プラットフォーム手数料：40%
const totalCompensation = dailyRate * workDays; // 報酬総額
const platformFeeAmount = Math.floor(totalCompensation * PLATFORM_FEE_RATE); // 手数料（40%）
```

**変更箇所**:
- 173-177行目: 日給の計算ロジック
- 145行目: リクエストボディの destructuring に `dailyRate` を追加
- 162行目以降: バリデーション追加
- 184-194行目: structured_messagesの data に `dailyRate` を保存（既存）
- 202-216行目: work_contracts に `daily_rate` を保存（既存）

#### 2-2. 薬局向け契約書PDF生成（新規）

**ファイル**: `backend/src/utils/pdfGenerator.js`

**新規関数の追加**:
```javascript
/**
 * 薬局向け契約書PDF生成
 */
const generatePharmacyContractPDF = (contractData) => {
  return new Promise((resolve, reject) => {
    try {
      // PDFディレクトリの確保
      const pdfDir = path.join(__dirname, '../../uploads/pharmacy-contracts');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // ファイル名生成
      const fileName = `pharmacy-contract-${contractData.contractId}-${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      // PDFドキュメント作成
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // 【内容】
      // - タイトル: 薬剤師体験期間 契約書
      // - 契約番号、発行日
      // - 薬局情報（薬局名、所在地）
      // - 薬剤師情報（氏名 ※手数料支払い後に開示）
      // - 契約内容:
      //   1. 初回出勤日
      //   2. 勤務日数: XX日
      //   3. 日給: ¥XX,XXX
      //   4. 報酬総額: ¥XXX,XXX
      //   5. 勤務時間（目安）
      //   6. プラットフォーム手数料: ¥XXX,XXX（報酬総額の40%）
      //   7. 支払い条件
      //   8. 契約期間の性質（体験期間）
      //   9. その他の条件
      // - 署名欄（薬局・薬剤師）
      // - 発行元情報

      // PDF生成処理（詳細は実装時に記述）
      
      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          url: `/uploads/pharmacy-contracts/${fileName}`
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateWorkNoticePDF,
  generatePharmacyContractPDF // 追加
};
```

#### 2-3. 労働条件通知書PDF改善

**ファイル**: `backend/src/utils/pdfGenerator.js`

**変更箇所**:
- 215-216行目: 勤務日数の表示（既存）
- 235-238行目: 賃金の表示

**現在のコード**:
```javascript
doc.text('6. 賃金')
   .text(`   日給: ¥25,000`)  // ← ハードコード
   .text(`   賃金締切日・支払日: 体験期間終了後（要協議）`)
   .text(`   賃金支払方法: 銀行振込等（要協議）`)
```

**変更後**:
```javascript
doc.text('6. 賃金')
   .text(`   日給: ¥${noticeData.dailyRate.toLocaleString()}`)  // ← 動的に変更
   .text(`   報酬総額: ¥${noticeData.totalCompensation.toLocaleString()}`)  // ← 追加
   .text(`   （日給 ¥${noticeData.dailyRate.toLocaleString()} × ${noticeData.workDays}日）`)  // ← 追加
   .text(`   賃金締切日・支払日: 体験期間終了後（要協議）`)
   .text(`   賃金支払方法: 銀行振込等（要協議）`)
```

#### 2-4. 正式オファー承諾時の処理

**ファイル**: `backend/src/controllers/structuredMessageController.js`

**変更箇所**: `respondToOffer` 関数（355-442行目）

**追加処理**:
- 薬剤師が承諾した際に、薬局向け契約書PDFを生成
- `work_contracts.pharmacy_contract_url` に保存（新規カラム追加が必要？）

**検討事項**:
- 薬局向け契約書を生成するタイミング:
  - オプション1: 薬剤師が承諾した時点（推奨）
  - オプション2: 手数料支払い確認後
  - **推奨**: オプション1（承諾時点で契約書を作成）

---

### Phase 3: フロントエンド変更

#### 3-1. 薬局ダッシュボード - 正式オファーモーダル

**ファイル**: `app/pharmacy/dashboard/page.tsx`

**変更箇所**: 1188-1321行目（正式オファー送信モーダル）

**追加するUI要素**:
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    日給 <span className="text-red-500">*</span>
  </label>
  <div className="flex items-center space-x-2">
    <span className="text-gray-600">¥</span>
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
      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>
  <p className="text-xs text-gray-500 mt-1">
    下限: 20,000円
  </p>
  {offerData.dailyRate < 20000 && (
    <p className="text-xs text-red-500 mt-1">
      ⚠️ 日給は20,000円以上に設定してください
    </p>
  )}
</div>
```

**変更するUI要素**:
- 勤務日数の min 属性を `"10"` → `"15"` に変更
- 説明テキストを「10〜90日」→「15〜90日」に変更

**報酬総額の計算ボックス**:
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-700">日給:</span>
      <span className="text-sm font-semibold text-gray-900">
        ¥{offerData.dailyRate.toLocaleString()}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-700">勤務日数:</span>
      <span className="text-sm font-semibold text-gray-900">{offerData.workDays}日</span>
    </div>
    <div className="border-t border-blue-300 my-2"></div>
    <div className="flex justify-between items-center">
      <span className="text-base font-medium text-gray-800">報酬総額:</span>
      <span className="text-lg font-bold text-blue-600">
        ¥{(offerData.workDays * offerData.dailyRate).toLocaleString()}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-700">プラットフォーム手数料（40%）:</span>
      <span className="text-sm font-semibold text-orange-600">
        ¥{Math.floor(offerData.workDays * offerData.dailyRate * 0.40).toLocaleString()}
      </span>
    </div>
  </div>
</div>
```

**State の変更**:
```tsx
const [offerData, setOfferData] = useState({
  initialWorkDate: '',
  workDays: 15,  // デフォルトを10→15に変更
  dailyRate: 20000,  // 新規追加（デフォルト2万円）
  workHours: '9:00-18:00',
  paymentDeadline: ''
});
```

**handleSendFormalOffer 関数の変更**:
```tsx
const handleSendFormalOffer = async () => {
  if (!selectedApplication) return;

  if (!offerData.initialWorkDate || !offerData.paymentDeadline) {
    alert('初回出勤日と支払い期限を入力してください');
    return;
  }

  // バリデーション追加
  if (offerData.dailyRate < 20000) {
    alert('日給は20,000円以上に設定してください');
    return;
  }

  if (offerData.workDays < 15 || offerData.workDays > 90) {
    alert('勤務日数は15日〜90日の範囲で設定してください');
    return;
  }

  const totalCompensation = offerData.dailyRate * offerData.workDays;
  const platformFee = Math.floor(totalCompensation * 0.40);

  try {
    await sendFormalOffer({
      applicationId: selectedApplication.id,
      initialWorkDate: offerData.initialWorkDate,
      workDays: offerData.workDays,
      dailyRate: offerData.dailyRate,  // 追加
      workHours: offerData.workHours,
      paymentDeadline: offerData.paymentDeadline
    });
    
    alert(`正式オファーを送信しました\n日給: ${offerData.dailyRate.toLocaleString()}円\n勤務日数: ${offerData.workDays}日\n報酬総額: ${totalCompensation.toLocaleString()}円\nプラットフォーム手数料: ${platformFee.toLocaleString()}円`);
    
    setShowFormalOfferModal(false);
    setOfferData({
      initialWorkDate: '',
      workDays: 15,
      dailyRate: 20000,
      workHours: '9:00-18:00',
      paymentDeadline: ''
    });
  } catch (err) {
    console.error('Failed to send formal offer:', err);
    alert('正式オファーの送信に失敗しました');
  }
};
```

#### 3-2. 薬局ダッシュボード - 契約詳細表示

**ファイル**: `app/pharmacy/dashboard/page.tsx`

**追加箇所**: 契約詳細モーダル内

**追加するUI要素**:
```tsx
<div className="border-t pt-4">
  <h4 className="font-semibold text-gray-800 mb-3">📄 契約書</h4>
  <div className="space-y-2">
    <button
      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${selectedContract.pharmacyContractUrl}`, '_blank')}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
    >
      <FileText className="w-4 h-4" />
      <span>薬局向け契約書をダウンロード</span>
    </button>
    <button
      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${selectedContract.pharmacyContractUrl}?preview=true`, '_blank')}
      className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
    >
      <Eye className="w-4 h-4" />
      <span>プレビュー</span>
    </button>
  </div>
</div>
```

#### 3-3. 薬剤師ダッシュボード - 正式オファー表示

**ファイル**: `app/pharmacist/dashboard/page.tsx`

**変更箇所**: 正式オファー表示UI（978-1032行目あたり）

**変更内容**:
- 日給を動的に表示（25,000円固定→可変）
- 報酬総額の計算式を表示

```tsx
<div className="space-y-3">
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">日給:</span>
    <span className="text-base font-semibold text-gray-900">
      ¥{structuredMsg.data.dailyRate.toLocaleString()}
    </span>
  </div>
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">勤務日数:</span>
    <span className="text-base font-semibold text-gray-900">
      {structuredMsg.data.workDays}日
    </span>
  </div>
  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
    <span className="text-base font-medium text-gray-800">報酬総額:</span>
    <span className="text-xl font-bold text-blue-600">
      ¥{structuredMsg.data.totalCompensation.toLocaleString()}
    </span>
  </div>
  <p className="text-xs text-gray-500">
    （日給 ¥{structuredMsg.data.dailyRate.toLocaleString()} × {structuredMsg.data.workDays}日）
  </p>
</div>
```

#### 3-4. API型定義の変更

**ファイル**: `lib/api/structuredMessages.ts`

**変更箇所**: `SendFormalOfferData` インターフェース

```typescript
export interface SendFormalOfferData {
  applicationId: string;
  initialWorkDate: string;
  workDays: number;
  dailyRate: number;  // 追加
  workHours: string;
  paymentDeadline: string;
}
```

**ファイル**: `lib/api/contracts.ts` または `lib/api/index.ts`

**変更箇所**: `WorkContract` インターフェース

```typescript
export interface WorkContract {
  id: string;
  // ... 既存フィールド
  dailyRate: number;
  workDaysCount: number;  // 勤務日数
  totalCompensation: number;
  pharmacyContractUrl?: string;  // 薬局向け契約書URL（追加）
  workNoticeUrl?: string;  // 労働条件通知書URL（既存）
  // ... その他
}
```

---

### Phase 4: PDF生成機能の改善

#### 4-1. 請求書PDF

**ファイル**: `backend/src/utils/pdfGenerator.js`

**変更箇所**: 69-76行目

**現在のコード**:
```javascript
doc.text('薬剤師採用マッチングサービス利用料', col1X, rowY);
doc.text(`¥${invoiceData.totalCompensation.toLocaleString()}`, col3X, rowY, { align: 'right' });
rowY += 20;

doc.fontSize(9)
   .fillColor('gray')
   .text(`（日給 ¥25,000 × ${invoiceData.workDays}日）`, col1X + 20, rowY);
```

**変更後**:
```javascript
doc.text('薬剤師採用マッチングサービス利用料', col1X, rowY);
doc.text(`¥${invoiceData.totalCompensation.toLocaleString()}`, col3X, rowY, { align: 'right' });
rowY += 20;

doc.fontSize(9)
   .fillColor('gray')
   .text(`（日給 ¥${invoiceData.dailyRate.toLocaleString()} × ${invoiceData.workDays}日）`, col1X + 20, rowY);
```

**必要なデータ**: `invoiceData.dailyRate` を追加で渡す必要がある

---

## 📦 実装の優先順位と推奨順序

### Step 1: バックエンドAPI修正（優先度: 最高）
1. `structuredMessageController.js` の修正
   - 日給をリクエストから受け取る
   - バリデーション追加（日給 ≥ 20,000円、勤務日数 15〜90日）
   - 計算ロジックの変更
2. `pdfGenerator.js` の労働条件通知書修正
   - 日給を動的に表示
   - 報酬総額を追加
3. `pdfGenerator.js` の請求書修正
   - 日給を動的に表示

### Step 2: フロントエンドUI修正（優先度: 高）
1. 薬局ダッシュボード - 正式オファーモーダル
   - 日給入力フィールド追加
   - バリデーション追加
   - 勤務日数の下限を15日に変更
   - State とハンドラーの修正
2. API型定義の更新
3. 薬剤師ダッシュボード - 正式オファー表示
   - 日給を動的に表示

### Step 3: 薬局向け契約書PDF生成（優先度: 中）
1. `pdfGenerator.js` に新規関数追加
2. `structuredMessageController.js` の `respondToOffer` 関数に統合
3. データベースに `pharmacy_contract_url` を保存
4. 薬局ダッシュボードにダウンロードボタン追加

### Step 4: テスト・動作確認（優先度: 高）
1. 日給のバリデーションテスト
2. 報酬計算の正確性確認
3. PDF生成の確認
4. エンドツーエンドテスト

---

## 🗂️ 変更ファイル一覧

### バックエンド
| ファイル | 変更内容 | 優先度 |
|---------|----------|--------|
| `backend/src/controllers/structuredMessageController.js` | 日給受取、バリデーション、計算ロジック | 最高 |
| `backend/src/utils/pdfGenerator.js` | 労働条件通知書・請求書の日給表示改善 | 高 |
| `backend/src/utils/pdfGenerator.js` | 薬局向け契約書PDF生成（新規関数） | 中 |

### フロントエンド
| ファイル | 変更内容 | 優先度 |
|---------|----------|--------|
| `app/pharmacy/dashboard/page.tsx` | 正式オファーモーダル（日給入力追加、勤務日数下限変更） | 最高 |
| `app/pharmacy/dashboard/page.tsx` | 契約詳細モーダル（契約書ダウンロードボタン追加） | 中 |
| `app/pharmacist/dashboard/page.tsx` | 正式オファー表示（日給動的表示） | 高 |
| `lib/api/structuredMessages.ts` | 型定義（dailyRate追加） | 高 |
| `lib/api/index.ts` または `lib/api/contracts.ts` | WorkContract型定義（pharmacyContractUrl追加） | 中 |

### データベース
| 変更内容 | 優先度 |
|---------|--------|
| スキーマ変更なし（既存カラムを活用） | - |
| `work_contracts.pharmacy_contract_url` の追加（オプション） | 低 |

---

## ⚠️ 注意事項・検討事項

### 1. データベースの pharmacy_contract_url カラム追加について
**検討ポイント**:
- 現在の `work_contracts` テーブルには `work_notice_url`（労働条件通知書）はあるが、`pharmacy_contract_url` はない
- 追加するか、`work_notice_url` を両者共通として使用するか

**推奨**: 
- 新規カラム `pharmacy_contract_url` を追加
- 理由: 薬局向け契約書と薬剤師向け労働条件通知書は別の書類として管理すべき

**マイグレーション**:
```sql
ALTER TABLE work_contracts 
ADD COLUMN pharmacy_contract_url VARCHAR(500);

COMMENT ON COLUMN work_contracts.pharmacy_contract_url IS '薬局向け契約書PDFのURL';
```

### 2. 日給のデフォルト値
**現在**: 25,000円（コード内）
**変更後**: 20,000円（下限値）

**UI上の推奨デフォルト**: 
- 22,000円〜25,000円が妥当（薬剤師の平均的な日給相場を考慮）
- 実装では 20,000円を安全な下限として設定

### 3. 後方互換性
**既存の契約データ**:
- 既存の契約（日給25,000円固定で作成されたもの）は影響を受けない
- `work_contracts.daily_rate` カラムは既に存在し、25,000が保存されている

**新規契約**:
- 日給を薬局側が指定できるようになる

### 4. プラットフォーム手数料の計算
**変更なし**: 報酬総額の40%（固定）

**柔軟性の検討**:
- 今後、手数料率も変更可能にするか？
- 現時点では40%固定で実装を推奨

### 5. 薬局向け契約書のタイミング
**推奨**: 薬剤師が承諾した時点で生成

**理由**:
- 契約成立時点で双方が確認できる書類が必要
- 手数料支払い確認を待つと、契約書発行が遅れる

**代替案**: 
- オファー送信時に生成（薬剤師の氏名が確定していないため不可）
- 手数料支払い確認後に生成（遅すぎる）

---

## 📊 実装工数見積もり

| Phase | 作業内容 | 見積もり時間 |
|-------|----------|-------------|
| Step 1 | バックエンドAPI修正 | 2-3時間 |
| Step 2 | フロントエンドUI修正 | 3-4時間 |
| Step 3 | 薬局向け契約書PDF生成 | 2-3時間 |
| Step 4 | テスト・動作確認 | 2時間 |
| **合計** | | **9-12時間** |

---

## ✅ チェックリスト

### バックエンド
- [ ] `structuredMessageController.js` - 日給受取処理追加
- [ ] `structuredMessageController.js` - バリデーション追加
- [ ] `structuredMessageController.js` - 勤務日数下限を15日に変更
- [ ] `pdfGenerator.js` - 労働条件通知書の日給・報酬総額を動的表示
- [ ] `pdfGenerator.js` - 請求書の日給を動的表示
- [ ] `pdfGenerator.js` - 薬局向け契約書PDF生成関数追加（新規）
- [ ] データベースマイグレーション（pharmacy_contract_url追加）

### フロントエンド
- [ ] `app/pharmacy/dashboard/page.tsx` - 日給入力フィールド追加
- [ ] `app/pharmacy/dashboard/page.tsx` - 日給バリデーション追加
- [ ] `app/pharmacy/dashboard/page.tsx` - 勤務日数下限を15日に変更
- [ ] `app/pharmacy/dashboard/page.tsx` - State・ハンドラー修正
- [ ] `app/pharmacy/dashboard/page.tsx` - 契約書ダウンロードボタン追加
- [ ] `app/pharmacist/dashboard/page.tsx` - 正式オファー表示の日給を動的化
- [ ] `lib/api/structuredMessages.ts` - 型定義更新（dailyRate追加）
- [ ] `lib/api/index.ts` - WorkContract型定義更新

### テスト
- [ ] 日給20,000円未満のバリデーション動作確認
- [ ] 勤務日数15日未満のバリデーション動作確認
- [ ] 報酬総額の計算が正確か確認
- [ ] プラットフォーム手数料の計算が正確か確認
- [ ] 請求書PDFに日給が正しく表示されるか確認
- [ ] 労働条件通知書PDFに日給・報酬総額が表示されるか確認
- [ ] 薬局向け契約書PDFが生成されるか確認
- [ ] エンドツーエンドテスト（オファー送信〜承諾〜契約書発行）

---

## 📝 次のステップ

1. **この計画書のレビュー**: 変更内容・影響範囲が適切か確認
2. **実装の承認**: コーディング開始の許可
3. **Step 1から順次実装**: バックエンド → フロントエンド → 契約書PDF
4. **各Stepごとにテスト実施**
5. **VPSへのデプロイ**

---

**計画書作成日**: 2026年1月26日  
**作成者**: AI Assistant

