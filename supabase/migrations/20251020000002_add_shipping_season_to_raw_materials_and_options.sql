-- Add missing fields to raw_materials and option_products

-- 원물 테이블에 발송기한 추가 (시즌 날짜는 이미 있음)
ALTER TABLE raw_materials
ADD COLUMN IF NOT EXISTS shipping_deadline INTEGER;

-- 옵션상품 테이블에 시즌 날짜 추가 (발송기한은 이미 있음)
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS season_start_date VARCHAR(5);

ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS season_end_date VARCHAR(5);

-- 컬럼 설명 추가
COMMENT ON COLUMN raw_materials.shipping_deadline IS '발송기한 (일 단위) - 품목에서 상속';
COMMENT ON COLUMN option_products.season_start_date IS '시즌 시작일 (MM-DD 형식) - 원물에서 상속';
COMMENT ON COLUMN option_products.season_end_date IS '시즌 종료일 (MM-DD 형식) - 원물에서 상속';
