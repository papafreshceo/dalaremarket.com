-- supply_status_settings 테이블의 status_type을 업데이트
-- 기존 데이터를 먼저 확인하고 안전하게 업데이트

-- 1. CHECK 제약조건 삭제
ALTER TABLE supply_status_settings
DROP CONSTRAINT IF EXISTS supply_status_settings_status_type_check;

-- 2. 기존 데이터 업데이트
-- raw_material -> product (품목 마스터 전용)
UPDATE supply_status_settings
SET status_type = 'product'
WHERE status_type IN ('raw_material', 'products');

-- optional_product, option_product -> option_products (옵션상품 전용)
UPDATE supply_status_settings
SET status_type = 'option_products'
WHERE status_type IN ('optional_product', 'option_product');

-- 3. 새로운 CHECK 제약조건 추가 (product, option_products만 허용)
ALTER TABLE supply_status_settings
ADD CONSTRAINT supply_status_settings_status_type_check
CHECK (status_type IN ('product', 'option_products'));

-- 4. 주석 추가
COMMENT ON COLUMN supply_status_settings.status_type IS '상태 타입: product (품목 마스터), option_products (옵션상품)';
