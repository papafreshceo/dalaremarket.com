-- supply_status 검증 구조 변경
-- 원물/옵션상품: 검증 제거 (품목 마스터에서 상속받음)
-- 품목 마스터: 검증 추가 (supply_status_settings 기준)

-- 1. raw_materials의 supply_status 검증 트리거/제약조건 모두 삭제
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'raw_materials'
          AND NOT t.tgisinternal
          AND (tgname LIKE '%supply_status%' OR tgname LIKE '%validate%' OR tgname LIKE '%status%')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON raw_materials CASCADE', trigger_rec.tgname);
        RAISE NOTICE 'Dropped trigger from raw_materials: %', trigger_rec.tgname;
    END LOOP;
END $$;

DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'raw_materials'::regclass
          AND contype = 'c'
          AND (conname LIKE '%supply_status%' OR conname LIKE '%status%')
    LOOP
        EXECUTE format('ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_rec.conname);
        RAISE NOTICE 'Dropped constraint from raw_materials: %', constraint_rec.conname;
    END LOOP;
END $$;

-- 2. option_products의 supply_status 검증 트리거/제약조건 모두 삭제
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'option_products'
          AND NOT t.tgisinternal
          AND (tgname LIKE '%supply_status%' OR tgname LIKE '%validate%' OR tgname LIKE '%status%')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON option_products CASCADE', trigger_rec.tgname);
        RAISE NOTICE 'Dropped trigger from option_products: %', trigger_rec.tgname;
    END LOOP;
END $$;

DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'option_products'::regclass
          AND contype = 'c'
          AND (conname LIKE '%supply_status%' OR conname LIKE '%status%')
    LOOP
        EXECUTE format('ALTER TABLE option_products DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_rec.conname);
        RAISE NOTICE 'Dropped constraint from option_products: %', constraint_rec.conname;
    END LOOP;
END $$;

-- 3. products_master에 supply_status 검증 함수 및 트리거 추가
CREATE OR REPLACE FUNCTION validate_products_master_status()
RETURNS TRIGGER AS $$
BEGIN
  -- raw_material_status 검증
  IF NEW.raw_material_status IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM supply_status_settings
      WHERE code = NEW.raw_material_status
        AND status_type = 'raw_material'
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid raw_material_status: %. Supply status must be registered in supply_status_settings with status_type=raw_material and is_active=true', NEW.raw_material_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_validate_products_master_status ON products_master;

CREATE TRIGGER trigger_validate_products_master_status
  BEFORE INSERT OR UPDATE ON products_master
  FOR EACH ROW
  EXECUTE FUNCTION validate_products_master_status();

COMMENT ON FUNCTION validate_products_master_status() IS '품목 마스터의 상태값을 supply_status_settings 기준으로 검증';
COMMENT ON TRIGGER trigger_validate_products_master_status ON products_master IS '품목 마스터 저장 시 상태값 검증 (원물/옵션상품은 상속받으므로 검증 불필요)';
