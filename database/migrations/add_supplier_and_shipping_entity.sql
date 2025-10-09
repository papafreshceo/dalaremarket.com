-- option_products 테이블에 supplier_id와 shipping_entity 컬럼 추가

-- 1. supplier_id: 원물거래처 (partners 테이블 참조)
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN option_products.supplier_id IS '원물거래처 ID';

-- 2. shipping_entity: 출고 주체 (자사/위탁)
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS shipping_entity TEXT;

COMMENT ON COLUMN option_products.shipping_entity IS '출고 주체 (자사/위탁)';
