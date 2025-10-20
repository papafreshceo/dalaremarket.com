-- 카테고리 설정 테이블 단순화
-- expense_type(지출유형), category_1~5(대분류/중분류/소분류/품목/품종), notes(비고)만 유지

-- 불필요한 컬럼 삭제
ALTER TABLE category_settings
DROP COLUMN IF EXISTS category_4_code,
DROP COLUMN IF EXISTS raw_material_status,
DROP COLUMN IF EXISTS seller_supply,
DROP COLUMN IF EXISTS is_best,
DROP COLUMN IF EXISTS is_recommended,
DROP COLUMN IF EXISTS has_image,
DROP COLUMN IF EXISTS has_detail_page,
DROP COLUMN IF EXISTS shipping_deadline,
DROP COLUMN IF EXISTS season_start_date,
DROP COLUMN IF EXISTS season_end_date,
DROP COLUMN IF EXISTS is_active;

-- 주석 추가
COMMENT ON TABLE category_settings IS '카테고리 조견표 - 지출유형/대분류/중분류/소분류/품목/품종 관리';
COMMENT ON COLUMN category_settings.expense_type IS '지출 유형 (사입/지출/가공 등)';
COMMENT ON COLUMN category_settings.category_1 IS '대분류';
COMMENT ON COLUMN category_settings.category_2 IS '중분류';
COMMENT ON COLUMN category_settings.category_3 IS '소분류';
COMMENT ON COLUMN category_settings.category_4 IS '품목';
COMMENT ON COLUMN category_settings.category_5 IS '품종 (지출 시 사용)';
COMMENT ON COLUMN category_settings.notes IS '비고';
