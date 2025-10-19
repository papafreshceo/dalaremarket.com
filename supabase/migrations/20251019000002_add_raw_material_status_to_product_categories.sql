-- 품목(category_4)에 원물 상태 컬럼 추가
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS raw_material_status VARCHAR(50);

-- 원물 상태는 supply_status_settings의 code 값을 참조
COMMENT ON COLUMN product_categories.raw_material_status IS '품목의 원물 공급 상태 (supply_status_settings.code 참조)';

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_product_categories_raw_material_status
ON product_categories(raw_material_status)
WHERE raw_material_status IS NOT NULL;
