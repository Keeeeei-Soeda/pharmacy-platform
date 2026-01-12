# Phase 4: 構造化メッセージ - フロントエンド実装ガイド

## ✅ 完了済み

### バックエンド
- ✅ 構造化メッセージコントローラー作成
- ✅ API ルート設定
- ✅ VPSデプロイ完了

### フロントエンドAPI定義
- ✅ `lib/api/structuredMessages.ts` 作成
- ✅ API型定義とクライアント関数実装

## 📝 実装が必要なUI

### 1. 薬局側ダッシュボード（応募詳細モーダル）

**場所:** `app/pharmacy/dashboard/page.tsx`

**機能:**
- 応募承認後に「初回出勤日の候補を提案」ボタンを表示
- モーダルを開いて複数の候補日を選択（2週間後以降の日付）
- `proposeDates` APIを呼び出して候補を送信

**実装箇所:**
```typescript
// 応募詳細モーダル内（selectedApplication表示部分）
{selectedApplication.status === 'accepted' && (
  <button onClick={() => setShowDateProposalModal(true)}>
    📅 初回出勤日の候補を提案
  </button>
)}

// 日付候補提案モーダル
{showDateProposalModal && (
  <div className="modal">
    <h3>初回出勤日の候補を選択</h3>
    <DatePicker multiple min={twoWeeksLater} />
    <button onClick={handleProposeDates}>送信</button>
  </div>
)}
```

### 2. 薬剤師側ダッシュボード（構造化メッセージ表示）

**場所:** `app/pharmacist/dashboard/page.tsx`

**機能:**
- 構造化メッセージを専用UIで表示
- `date_proposal`メッセージ：ボタンで日付選択
- `formal_offer`メッセージ：承諾/辞退ボタン

**実装箇所:**
```typescript
// メッセージリスト内で構造化メッセージを判定
{message.type === 'structured' && (
  <StructuredMessageComponent 
    message={message}
    onSelectDate={handleSelectDate}
    onRespondOffer={handleRespondOffer}
  />
)}
```

### 3. 正式オファー送信機能（薬局側）

**場所:** `app/pharmacy/dashboard/page.tsx`

**機能:**
- 薬剤師が日付を選択後、正式オファーモーダルを表示
- 契約条件を入力（勤務日数、報酬、プラットフォーム手数料など）
- `sendFormalOffer` APIを呼び出し

**実装箇所:**
```typescript
// 正式オファーモーダル
{showFormalOfferModal && (
  <div className="modal">
    <h3>正式オファーを送信</h3>
    <input type="date" value={initialWorkDate} />
    <input type="number" value={workDays} />
    <input type="number" value={totalCompensation} />
    <button onClick={handleSendFormalOffer}>オファーを送信</button>
  </div>
)}
```

## 🔄 処理フロー

### 薬局側フロー
1. 応募を承認
2. 「初回出勤日の候補を提案」ボタンをクリック
3. モーダルで複数の候補日を選択（2週間後以降）
4. `proposeDates` APIで候補を送信
5. 薬剤師が日付を選択するのを待つ
6. 選択通知を受け取ったら「正式オファーを送信」ボタンが表示される
7. 正式オファーモーダルで契約条件を入力
8. `sendFormalOffer` APIでオファーを送信

### 薬剤師側フロー
1. 構造化メッセージを受信
2. `date_proposal`メッセージでボタンから日付を選択
3. `selectDate` APIで選択を送信
4. `formal_offer`メッセージを受信
5. 契約条件を確認
6. 「承諾」または「辞退」ボタンをクリック
7. `respondToOffer` APIで回答を送信

## 💾 状態管理

### 薬局ダッシュボード
```typescript
const [showDateProposalModal, setShowDateProposalModal] = useState(false);
const [proposedDates, setProposedDates] = useState<string[]>([]);
const [showFormalOfferModal, setShowFormalOfferModal] = useState(false);
const [offerData, setOfferData] = useState({
  initialWorkDate: '',
  workDays: 30,
  totalCompensation: 750000,
  workHours: '9:00-18:00',
  platformFee: 50000,
  paymentDeadline: ''
});
```

### 薬剤師ダッシュボード
```typescript
const [structuredMessages, setStructuredMessages] = useState<StructuredMessage[]>([]);
const [selectedDateMessage, setSelectedDateMessage] = useState<StructuredMessage | null>(null);
const [selectedOfferMessage, setSelectedOfferMessage] = useState<StructuredMessage | null>(null);
```

## 📦 必要なコンポーネント

### 汎用コンポーネント
- `DatePicker`: 複数日付選択可能なカレンダーコンポーネント
- `StructuredMessageCard`: 構造化メッセージ表示用カード
- `DateSelectionButtons`: ボタンで日付を選択するコンポーネント
- `FormalOfferCard`: 正式オファーの内容を表示するカード

## 🚀 実装の優先順位

1. **高**: 薬局側の日付候補提案機能
2. **高**: 薬剤師側の日付選択機能
3. **中**: 正式オファー送信機能
4. **中**: 構造化メッセージの表示UI改善
5. **低**: リアルタイム通知

## 📝 注意事項

- すべての日付は2週間後以降のみ選択可能
- 構造化メッセージは既存のメッセージスレッドと分離して管理
- ボタンは1回のみクリック可能（responded_at が設定されたら無効化）
- エラーハンドリングを適切に実装

---

**次のアクション:**
薬局ダッシュボードに日付候補提案機能を実装する

