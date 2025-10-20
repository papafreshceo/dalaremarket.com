-- 품목 마스터 참조 추가
-- raw_materials와 option_products에 product_master_id 추가하여 상속 구조 구축

-- 1. raw_materials에 product_master_id 추가
ALTER TABLE raw_materials
ADD COLUMN IF NOT EXISTS product_master_id UUID REFERENCES products_master(id) ON DELETE SET NULL;

-- 2. option_products에 product_master_id 추가
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS product_master_id UUID REFERENCES products_master(id) ON DELETE SET NULL;

-- 3. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_raw_materials_product_master_id ON raw_materials(product_master_id);
CREATE INDEX IF NOT EXISTS idx_option_products_product_master_id ON option_products(product_master_id);

-- 4. 주석 추가
COMMENT ON COLUMN raw_materials.product_master_id IS '품목 마스터 참조 (카테고리 및 속성 상속)';
COMMENT ON COLUMN option_products.product_master_id IS '품목 마스터 참조 (카테고리 및 속성 상속)';

-- 5. 기존 category_4 기반으로 product_master_id 자동 매핑
-- raw_materials 매핑
UPDATE raw_materials rm
SET product_master_id = pm.id
FROM products_master pm
WHERE rm.category_4 IS NOT NULL
  AND pm.category_3 = rm.category_4
  AND rm.product_master_id IS NULL;

-- option_products 매핑 (category_4 기준)
UPDATE option_products op
SET product_master_id = pm.id
FROM products_master pm
WHERE op.category_4 IS NOT NULL
  AND pm.category_3 = op.category_4
  AND op.product_master_id IS NULL;
