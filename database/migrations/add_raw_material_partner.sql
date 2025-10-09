-- option_products 테이블에 raw_material_partner 컬럼 추가

-- raw_material_partner: 원물거래처 (partners 테이블 참조)
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS raw_material_partner UUID REFERENCES partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN option_products.raw_material_partner IS '원물거래처 ID';
