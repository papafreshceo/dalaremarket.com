-- ============================================
-- 옵션상품 가격 정책 기능 추가
-- ============================================
-- 목적: 시세 변동과 판매가를 분리하여 관리
-- - 시세는 material_price_history에 계속 기록
-- - 옵션상품은 "자동반영" 또는 "고정가" 선택 가능
-- - B2B(셀러공급가), B2C(직접판매가) 각각 다른 정책 적용 가능
-- ============================================

-- 1. option_products 테이블에 가격 정책 관련 컬럼 추가
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS price_policy_b2b TEXT DEFAULT 'auto' CHECK (price_policy_b2b IN ('auto', 'fixed'));
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS price_policy_b2c TEXT DEFAULT 'auto' CHECK (price_policy_b2c IN ('auto', 'fixed'));
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS fixed_material_cost NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS seller_supply_price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE option_products ADD COLUMN IF NOT EXISTS direct_sale_price NUMERIC(10, 2) DEFAULT 0;

-- 2. 기존 데이터 마이그레이션 (기존 옵션상품은 자동반영 정책 유지)
UPDATE option_products
SET
  price_policy_b2b = 'auto',
  price_policy_b2c = 'auto',
  fixed_material_cost = COALESCE(raw_material_cost, 0),
  seller_supply_price = 0,
  direct_sale_price = 0
WHERE price_policy_b2b IS NULL;

-- 3. 컬럼 설명 추가
COMMENT ON COLUMN option_products.price_policy_b2b IS '셀러공급가 가격 정책 (auto: 최신시세 자동반영, fixed: 고정가 사용)';
COMMENT ON COLUMN option_products.price_policy_b2c IS '직접판매가 가격 정책 (auto: 최신시세 자동반영, fixed: 고정가 사용)';
COMMENT ON COLUMN option_products.fixed_material_cost IS '고정 원물가 (price_policy가 fixed일 때 사용)';
COMMENT ON COLUMN option_products.seller_supply_price IS '셀러공급가 (B2B)';
COMMENT ON COLUMN option_products.direct_sale_price IS '직접판매가 (B2C)';

-- 완료
SELECT '✅ 옵션상품 가격 정책 컬럼 추가 완료!' as result;
