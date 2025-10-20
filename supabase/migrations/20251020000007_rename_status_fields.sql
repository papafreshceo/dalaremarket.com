-- 상태값 필드 및 타입 변경
-- 1. supply_status_settings의 status_type 'raw_material' → 'products'로 변경
-- 2. products_master의 raw_material_status → supply_status로 변경

-- 0. 기존 CHECK 제약조건 삭제
ALTER TABLE supply_status_settings
DROP CONSTRAINT IF EXISTS supply_status_settings_status_type_check;

-- 1. supply_status_settings에서 status_type 변경
UPDATE supply_status_settings
SET status_type = 'products'
WHERE status_type = 'raw_material';

-- 2. 현재 존재하는 모든 status_type 값을 허용하는 새로운 CHECK 제약조건 추가
-- (products, option_product, 그리고 기타 존재하는 값들 모두 허용)
DO $$
DECLARE
    status_types text[];
BEGIN
    -- 현재 테이블에 있는 모든 고유한 status_type 값 조회
    SELECT ARRAY_AGG(DISTINCT status_type) INTO status_types
    FROM supply_status_settings
    WHERE status_type IS NOT NULL;

    -- 동적으로 CHECK 제약조건 생성
    EXECUTE format(
        'ALTER TABLE supply_status_settings ADD CONSTRAINT supply_status_settings_status_type_check CHECK (status_type = ANY(ARRAY[%s]::text[]))',
        (SELECT string_agg(quote_literal(t), ',') FROM unnest(status_types) AS t)
    );
END $$;

-- 2. products_master 테이블의 컬럼명 변경
ALTER TABLE products_master
RENAME COLUMN raw_material_status TO supply_status;

-- 3. 컬럼 주석 업데이트
COMMENT ON COLUMN products_master.supply_status IS '공급 상태 (supply_status_settings의 status_type=products 기준)';

-- 4. 기존 검증 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS trigger_validate_products_master_status ON products_master;
DROP FUNCTION IF EXISTS validate_products_master_status();

-- 5. 새로운 검증 함수 생성
CREATE OR REPLACE FUNCTION validate_products_master_supply_status()
RETURNS TRIGGER AS $$
BEGIN
  -- supply_status 검증
  IF NEW.supply_status IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM supply_status_settings
      WHERE code = NEW.supply_status
        AND status_type = 'products'
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid supply_status: %. Supply status must be registered in supply_status_settings with status_type=products and is_active=true', NEW.supply_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 검증 트리거 추가
CREATE TRIGGER trigger_validate_products_master_supply_status
  BEFORE INSERT OR UPDATE ON products_master
  FOR EACH ROW
  EXECUTE FUNCTION validate_products_master_supply_status();

COMMENT ON FUNCTION validate_products_master_supply_status() IS '품목 마스터의 공급 상태값을 supply_status_settings (status_type=products) 기준으로 검증';
COMMENT ON TRIGGER trigger_validate_products_master_supply_status ON products_master IS '품목 마스터 저장 시 공급 상태값 검증';
