-- Add shipping deadline and season dates to category_settings table

-- 발송기한 (일 단위)
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS shipping_deadline INTEGER;

-- 시즌 시작일 (MM-DD 형식, 예: '03-01')
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS season_start_date VARCHAR(5);

-- 시즌 종료일 (MM-DD 형식, 예: '11-30')
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS season_end_date VARCHAR(5);

-- 컬럼 설명 추가
COMMENT ON COLUMN category_settings.shipping_deadline IS '발송기한 (일 단위)';
COMMENT ON COLUMN category_settings.season_start_date IS '시즌 시작일 (MM-DD 형식)';
COMMENT ON COLUMN category_settings.season_end_date IS '시즌 종료일 (MM-DD 형식)';
