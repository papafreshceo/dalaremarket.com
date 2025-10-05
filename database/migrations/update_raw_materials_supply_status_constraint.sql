-- Remove hardcoded constraint and add validation for raw_materials.supply_status

-- 1. 기존 하드코딩된 제약조건 제거
ALTER TABLE raw_materials
DROP CONSTRAINT IF EXISTS raw_materials_supply_status_check;

-- 2. supply_status 유효성 검사 함수 생성
CREATE OR REPLACE FUNCTION validate_raw_material_supply_status()
RETURNS TRIGGER AS $$
BEGIN
  -- supply_status가 NULL이면 패스
  IF NEW.supply_status IS NULL THEN
    RETURN NEW;
  END IF;

  -- supply_status_settings에서 해당 name이 존재하는지 확인
  IF NOT EXISTS (
    SELECT 1
    FROM supply_status_settings
    WHERE status_type = 'raw_material'
      AND name = NEW.supply_status
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid supply_status: %. Supply status must be a valid name from supply_status_settings with status_type=raw_material and is_active=true', NEW.supply_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성 (INSERT/UPDATE 시 유효성 검사)
DROP TRIGGER IF EXISTS trigger_validate_raw_material_supply_status ON raw_materials;
CREATE TRIGGER trigger_validate_raw_material_supply_status
  BEFORE INSERT OR UPDATE ON raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION validate_raw_material_supply_status();

-- 4. 기존 데이터 검증 (문제가 있으면 에러 발생)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM raw_materials rm
  WHERE rm.supply_status IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM supply_status_settings sss
      WHERE sss.status_type = 'raw_material'
        AND sss.name = rm.supply_status
        AND sss.is_active = true
    );

  IF invalid_count > 0 THEN
    RAISE NOTICE 'Warning: Found % raw_materials with invalid supply_status values', invalid_count;
  END IF;
END $$;

COMMENT ON COLUMN raw_materials.supply_status IS 'Supply status name - must match a name in supply_status_settings where status_type=raw_material and is_active=true';
