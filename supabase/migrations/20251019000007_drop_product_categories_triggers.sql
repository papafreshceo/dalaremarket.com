-- Drop product_categories sync triggers and function

-- Drop triggers first
DROP TRIGGER IF EXISTS trg_sync_product_categories_insert ON category_settings;
DROP TRIGGER IF EXISTS trg_sync_product_categories_update ON category_settings;

-- Drop function
DROP FUNCTION IF EXISTS sync_product_categories();

-- Note: product_categories 테이블 관련 모든 트리거 및 함수 제거
