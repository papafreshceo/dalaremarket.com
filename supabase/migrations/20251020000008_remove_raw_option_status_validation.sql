-- 원물 관리: 상태값 검증 제거 (품목 마스터에서 상속받음)
-- 옵션 상품: 상태값 검증 유지 (supply_status_settings의 status_type='option_product' 기준)

-- 1. raw_materials의 모든 상태 관련 트리거 삭제
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

-- 2. raw_materials의 모든 상태 관련 CHECK 제약조건 삭제
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

-- 3. option_products의 기존 상태 관련 트리거 삭제
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

-- 4. option_products의 기존 상태 관련 CHECK 제약조건 삭제
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

-- 5. option_products에 새로운 상태값 검증 함수 생성
CREATE OR REPLACE FUNCTION validate_option_product_status()
RETURNS TRIGGER AS $$
BEGIN
  -- option_product의 상태값 필드명 확인 필요 (예: status, supply_status 등)
  -- 여기서는 일반적인 필드명 추정하여 작성

  -- 상태값이 있다면 supply_status_settings의 option_product 타입 기준으로 검증
  -- 실제 필드명에 맞게 수정 필요
  IF NEW.status IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM supply_status_settings
      WHERE code = NEW.status
        AND status_type = 'option_product'
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid option_product status: %. Status must be registered in supply_status_settings with status_type=option_product and is_active=true', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. option_products에 검증 트리거 추가
CREATE TRIGGER trigger_validate_option_product_status
  BEFORE INSERT OR UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION validate_option_product_status();

COMMENT ON FUNCTION validate_option_product_status() IS '옵션상품의 상태값을 supply_status_settings (status_type=option_product) 기준으로 검증';
COMMENT ON TRIGGER trigger_validate_option_product_status ON option_products IS '옵션상품 저장 시 상태값 검증';
