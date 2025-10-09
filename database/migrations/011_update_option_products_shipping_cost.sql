-- ===========================
-- option_products 테이블 수정
-- ===========================
-- 1. shipping_cost 컬럼 추가
-- 2. vendor_id 컬럼 삭제

-- 1. shipping_cost 컬럼 추가
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC;

COMMENT ON COLUMN option_products.shipping_cost IS '상품출고비용';

-- 2. vendor_id 컬럼 삭제 (CASCADE로 의존 뷰도 함께 삭제)
ALTER TABLE option_products
DROP COLUMN IF EXISTS vendor_id CASCADE;
