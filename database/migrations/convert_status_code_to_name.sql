-- 기존 데이터를 code 값에서 name 값으로 변환

-- 기존 제약조건 삭제
ALTER TABLE option_products DROP CONSTRAINT IF EXISTS product_options_supply_status_check;
ALTER TABLE option_products DROP CONSTRAINT IF EXISTS option_products_status_check;
ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS raw_materials_supply_status_check;

-- 트리거 삭제 (임시)
DROP TRIGGER IF EXISTS trigger_validate_option_product_status ON option_products;
DROP TRIGGER IF EXISTS trigger_validate_raw_material_supply_status ON raw_materials;

-- 1. option_products 테이블: status를 code → name으로 변환
UPDATE option_products op
SET status = (
  SELECT sss.name
  FROM supply_status_settings sss
  WHERE sss.status_type = 'optional_product'
    AND sss.code = op.status
    AND sss.is_active = true
  LIMIT 1
)
WHERE op.status IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM supply_status_settings sss
    WHERE sss.status_type = 'optional_product'
      AND sss.code = op.status
  );

-- 2. raw_materials 테이블: supply_status를 code → name으로 변환
UPDATE raw_materials rm
SET supply_status = (
  SELECT sss.name
  FROM supply_status_settings sss
  WHERE sss.status_type = 'raw_material'
    AND sss.code = rm.supply_status
    AND sss.is_active = true
  LIMIT 1
)
WHERE rm.supply_status IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM supply_status_settings sss
    WHERE sss.status_type = 'raw_material'
      AND sss.code = rm.supply_status
  );

-- 트리거 다시 생성
CREATE TRIGGER trigger_validate_option_product_status
  BEFORE INSERT OR UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION validate_option_product_status();

CREATE TRIGGER trigger_validate_raw_material_supply_status
  BEFORE INSERT OR UPDATE ON raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION validate_raw_material_supply_status();
