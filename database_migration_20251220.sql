-- ================================================================
-- 薬剤師マッチングプラットフォーム: データベースマイグレーション
-- 日付: 2025-12-20
-- 目的: 案件応募・募集システムのアップデート
-- ================================================================

-- ================================================================
-- STEP 1: 既存データの削除
-- ================================================================

-- 関連テーブルのデータを削除（外部キー制約を考慮した順序）
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE work_schedules CASCADE;
TRUNCATE TABLE work_contracts CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE message_threads CASCADE;
TRUNCATE TABLE job_applications CASCADE;
TRUNCATE TABLE job_postings CASCADE;
TRUNCATE TABLE monthly_summaries CASCADE;
TRUNCATE TABLE attendance_logs CASCADE;

-- 通知データも削除（必要に応じて）
-- TRUNCATE TABLE notifications CASCADE;

COMMENT ON STATEMENT IS '既存の応募・契約データを削除しました';

-- ================================================================
-- STEP 2: 新しいENUM型の追加
-- ================================================================

-- プラットフォーム手数料ステータス
CREATE TYPE platform_fee_status_enum AS ENUM (
  'pending',
  'paid',
  'overdue',
  'cancelled'
);

-- 構造化メッセージタイプ
CREATE TYPE structured_message_type_enum AS ENUM (
  'date_proposal',
  'date_selection',
  'condition_confirmation',
  'formal_offer',
  'offer_response'
);

-- ================================================================
-- STEP 3: 既存テーブルへのカラム追加
-- ================================================================

-- pharmacist_profiles テーブルの拡張
ALTER TABLE pharmacist_profiles
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS license_acquired_year INTEGER,
ADD COLUMN IF NOT EXISTS certified_pharmacist_qualifications TEXT[],
ADD COLUMN IF NOT EXISTS other_qualifications TEXT[],
ADD COLUMN IF NOT EXISTS work_experience_months INTEGER,
ADD COLUMN IF NOT EXISTS work_experience_types TEXT[],
ADD COLUMN IF NOT EXISTS main_job_experiences TEXT[],
ADD COLUMN IF NOT EXISTS specialty_fields TEXT[],
ADD COLUMN IF NOT EXISTS pharmacy_systems_experience TEXT[],
ADD COLUMN IF NOT EXISTS special_notes TEXT,
ADD COLUMN IF NOT EXISTS self_introduction TEXT;

COMMENT ON COLUMN pharmacist_profiles.age IS '年齢';
COMMENT ON COLUMN pharmacist_profiles.license_acquired_year IS '薬剤師免許取得年';
COMMENT ON COLUMN pharmacist_profiles.certified_pharmacist_qualifications IS '認定薬剤師資格（配列）';
COMMENT ON COLUMN pharmacist_profiles.other_qualifications IS 'その他の関連資格（配列）';
COMMENT ON COLUMN pharmacist_profiles.work_experience_months IS '勤務歴（月単位）';
COMMENT ON COLUMN pharmacist_profiles.work_experience_types IS '勤務経験のある業態（配列）';
COMMENT ON COLUMN pharmacist_profiles.main_job_experiences IS '主な業務経験（配列）';
COMMENT ON COLUMN pharmacist_profiles.specialty_fields IS '得意な診療科・疾患領域（配列）';
COMMENT ON COLUMN pharmacist_profiles.pharmacy_systems_experience IS '使用経験のある薬歴システム（配列）';
COMMENT ON COLUMN pharmacist_profiles.special_notes IS '特記事項';
COMMENT ON COLUMN pharmacist_profiles.self_introduction IS '自己紹介・アピールポイント';

-- pharmacy_profiles テーブルの拡張
ALTER TABLE pharmacy_profiles
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS can_post_jobs BOOLEAN DEFAULT true;

COMMENT ON COLUMN pharmacy_profiles.account_status IS 'アカウントステータス (active/suspended/banned)';
COMMENT ON COLUMN pharmacy_profiles.suspension_reason IS 'アカウント停止理由';
COMMENT ON COLUMN pharmacy_profiles.can_post_jobs IS '求人投稿可能フラグ';

-- work_contracts テーブルの拡張
ALTER TABLE work_contracts
ADD COLUMN IF NOT EXISTS initial_work_date DATE,
ADD COLUMN IF NOT EXISTS platform_fee_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS personal_info_disclosed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disclosed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN work_contracts.initial_work_date IS '初回出勤日';
COMMENT ON COLUMN work_contracts.platform_fee_status IS 'プラットフォーム手数料支払いステータス';
COMMENT ON COLUMN work_contracts.personal_info_disclosed IS '個人情報開示済みフラグ';
COMMENT ON COLUMN work_contracts.disclosed_at IS '個人情報開示日時';

-- ================================================================
-- STEP 4: 新規テーブルの作成
-- ================================================================

-- プラットフォーム手数料管理テーブル
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES work_contracts(id) ON DELETE CASCADE,
  pharmacy_id UUID REFERENCES pharmacy_profiles(id) ON DELETE CASCADE,
  pharmacist_id UUID,
  amount INTEGER NOT NULL,
  status platform_fee_status_enum DEFAULT 'pending',
  invoice_url VARCHAR(500),
  payment_deadline DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_platform_fees_contract_id ON platform_fees(contract_id);
CREATE INDEX idx_platform_fees_pharmacy_id ON platform_fees(pharmacy_id);
CREATE INDEX idx_platform_fees_status ON platform_fees(status);
CREATE INDEX idx_platform_fees_payment_deadline ON platform_fees(payment_deadline);

COMMENT ON TABLE platform_fees IS 'プラットフォーム手数料管理テーブル';
COMMENT ON COLUMN platform_fees.amount IS '手数料金額';
COMMENT ON COLUMN platform_fees.status IS '支払いステータス';
COMMENT ON COLUMN platform_fees.invoice_url IS '請求書PDF URL';
COMMENT ON COLUMN platform_fees.payment_deadline IS '支払い期限（初回出勤日の3日前）';
COMMENT ON COLUMN platform_fees.paid_at IS '支払い確認日時';

-- 構造化メッセージテーブル
CREATE TABLE IF NOT EXISTS structured_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  message_type structured_message_type_enum NOT NULL,
  data JSONB NOT NULL,
  sent_by UUID,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_data JSONB
);

CREATE INDEX idx_structured_messages_application_id ON structured_messages(application_id);
CREATE INDEX idx_structured_messages_message_type ON structured_messages(message_type);
CREATE INDEX idx_structured_messages_sent_at ON structured_messages(sent_at);

COMMENT ON TABLE structured_messages IS '構造化メッセージテーブル';
COMMENT ON COLUMN structured_messages.message_type IS 'メッセージタイプ';
COMMENT ON COLUMN structured_messages.data IS 'メッセージデータ（JSON形式）';
COMMENT ON COLUMN structured_messages.response_data IS '回答データ（JSON形式）';

-- ================================================================
-- STEP 5: インデックスの作成
-- ================================================================

-- pharmacist_profilesの新規フィールド用インデックス（必要に応じて）
CREATE INDEX IF NOT EXISTS idx_pharmacist_profiles_age ON pharmacist_profiles(age);
CREATE INDEX IF NOT EXISTS idx_pharmacist_profiles_license_acquired_year ON pharmacist_profiles(license_acquired_year);

-- pharmacy_profilesの新規フィールド用インデックス
CREATE INDEX IF NOT EXISTS idx_pharmacy_profiles_account_status ON pharmacy_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_profiles_can_post_jobs ON pharmacy_profiles(can_post_jobs);

-- work_contractsの新規フィールド用インデックス
CREATE INDEX IF NOT EXISTS idx_work_contracts_initial_work_date ON work_contracts(initial_work_date);
CREATE INDEX IF NOT EXISTS idx_work_contracts_platform_fee_status ON work_contracts(platform_fee_status);
CREATE INDEX IF NOT EXISTS idx_work_contracts_personal_info_disclosed ON work_contracts(personal_info_disclosed);

-- ================================================================
-- STEP 6: 確認用クエリ
-- ================================================================

-- 追加されたカラムの確認
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('pharmacist_profiles', 'pharmacy_profiles', 'work_contracts', 'platform_fees', 'structured_messages')
  AND column_name IN (
    'age', 'license_acquired_year', 'certified_pharmacist_qualifications', 
    'account_status', 'can_post_jobs',
    'initial_work_date', 'platform_fee_status', 'personal_info_disclosed'
  )
ORDER BY table_name, column_name;

-- 新規テーブルの確認
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name IN ('platform_fees', 'structured_messages')
ORDER BY table_name;

-- 新しいENUM型の確認
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('platform_fee_status_enum', 'structured_message_type_enum')
ORDER BY enum_name, e.enumsortorder;

-- ================================================================
-- マイグレーション完了
-- ================================================================

