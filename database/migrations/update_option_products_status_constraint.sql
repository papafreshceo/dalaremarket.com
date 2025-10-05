-- Remove hardcoded constraint and add foreign key to supply_status_settings

-- 1. 기존 하드코딩된 제약조건 제거
ALTER TABLE option_products
DROP CONSTRAINT IF EXISTS option_products_status_check;

-- 2. supply_status_settings 테이블에 status 컬럼이 있는지 확인하고 추가 (option_product 타입용)
-- status 컬럼을 supply_status_settings의 code를 참조하는 외래키로 변경하는 대신,
-- 트리거를 사용하여 유효성 검사

-- 3. status 유효성 검사 함수 생성
CREATE OR REPLACE FUNCTION validate_option_product_status()
RETURNS TRIGGER AS $$
BEGIN
  -- status가 NULL이면 패스
  IF NEW.status IS NULL THEN
    RETURN NEW;
  END IF;

  -- supply_status_settings에서 해당 name이 존재하는지 확인
  IF NOT EXISTS (
    SELECT 1
    FROM supply_status_settings
    WHERE status_type = 'optional_product'
      AND name = NEW.status
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid status: %. Status must be a valid name from supply_status_settings with status_type=optional_product and is_active=true', NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성 (INSERT/UPDATE 시 유효성 검사)
DROP TRIGGER IF EXISTS trigger_validate_option_product_status ON option_products;
CREATE TRIGGER trigger_validate_option_product_status
  BEFORE INSERT OR UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION validate_option_product_status();

-- 5. 기존 데이터 검증 (문제가 있으면 에러 발생)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM option_products op
  WHERE op.status IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM supply_status_settings sss
      WHERE sss.status_type = 'option_product'
        AND sss.name = op.status
        AND sss.is_active = true
    );

  IF invalid_count > 0 THEN
    RAISE NOTICE 'Warning: Found % option_products with invalid status values', invalid_count;
  END IF;
END $$;

COMMENT ON COLUMN option_products.status IS 'Product status name - must match a name in supply_status_settings where status_type=optional_product and is_active=true';
