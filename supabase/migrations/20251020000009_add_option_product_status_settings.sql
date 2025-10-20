-- 옵션상품에서 현재 사용 중인 상태값들을 supply_status_settings에 추가
-- status_type='option_product'로 설정

-- 1. CHECK 제약조건 삭제
ALTER TABLE supply_status_settings
DROP CONSTRAINT IF EXISTS supply_status_settings_status_type_check;

-- 2. 옵션상품 상태 추가 (이미 존재하는지 확인 후 추가)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM supply_status_settings WHERE code = 'SUPPLY' AND status_type = 'option_product') THEN
    INSERT INTO supply_status_settings (code, name, status_type, display_order, is_active, created_at, updated_at)
    VALUES ('SUPPLY', '공급중', 'option_product', 1, true, NOW(), NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM supply_status_settings WHERE code = 'SEASON_END_OPTION' AND status_type = 'option_product') THEN
    INSERT INTO supply_status_settings (code, name, status_type, display_order, is_active, created_at, updated_at)
    VALUES ('SEASON_END_OPTION', '시즌종료', 'option_product', 2, true, NOW(), NOW());
  END IF;
END $$;

-- 3. 현재 존재하는 모든 status_type 값을 허용하는 새로운 CHECK 제약조건 추가
DO $$
DECLARE
    status_types text[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT status_type) INTO status_types
    FROM supply_status_settings
    WHERE status_type IS NOT NULL;

    EXECUTE format(
        'ALTER TABLE supply_status_settings ADD CONSTRAINT supply_status_settings_status_type_check CHECK (status_type = ANY(ARRAY[%s]::text[]))',
        (SELECT string_agg(quote_literal(t), ',') FROM unnest(status_types) AS t)
    );
END $$;
