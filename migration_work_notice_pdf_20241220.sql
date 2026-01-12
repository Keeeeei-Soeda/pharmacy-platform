-- 労働条件通知書PDF化対応マイグレーション
-- 実行日: 2024-12-20

-- work_contracts テーブルに work_notice_url カラムを追加
ALTER TABLE work_contracts 
ADD COLUMN IF NOT EXISTS work_notice_url TEXT;

-- work_contracts テーブルに job_posting_id カラムを追加
ALTER TABLE work_contracts 
ADD COLUMN IF NOT EXISTS job_posting_id UUID;

-- work_contracts テーブルに start_date カラムを追加
ALTER TABLE work_contracts 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- work_contracts テーブルに work_days_count カラムを追加
ALTER TABLE work_contracts 
ADD COLUMN IF NOT EXISTS work_days_count INTEGER;

-- work_contracts テーブルに total_compensation カラムを追加
ALTER TABLE work_contracts 
ADD COLUMN IF NOT EXISTS total_compensation INTEGER;

-- カラムにコメントを追加
COMMENT ON COLUMN work_contracts.work_notice_url IS '労働条件通知書PDFのURL';
COMMENT ON COLUMN work_contracts.job_posting_id IS '関連する求人投稿ID';
COMMENT ON COLUMN work_contracts.start_date IS '契約開始日';
COMMENT ON COLUMN work_contracts.work_days_count IS '勤務日数';
COMMENT ON COLUMN work_contracts.total_compensation IS '報酬総額（日給25,000円 × 勤務日数）';

