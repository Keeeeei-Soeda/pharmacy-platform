-- マイグレーション: job_postingsテーブルにpreferred_scheduleカラムを追加
-- 実行日時: 2025-12-20

-- 新しいカラムを追加（任意項目なのでNULL許可）
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS preferred_schedule TEXT;

-- コメント追加
COMMENT ON COLUMN job_postings.preferred_schedule IS '希望勤務曜日・時間帯（任意）- 薬局が希望する勤務スケジュールの参考情報';

-- 確認用クエリ
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'job_postings' AND column_name = 'preferred_schedule';

