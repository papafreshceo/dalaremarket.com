-- shipping_entity 컬럼 타입을 UUID에서 TEXT로 변경

-- shipping_entity가 UUID 타입이면 TEXT로 변경
DO $$
BEGIN
  -- 기존 컬럼이 UUID 타입인 경우 삭제하고 TEXT로 재생성
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'option_products'
    AND column_name = 'shipping_entity'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE option_products DROP COLUMN IF EXISTS shipping_entity;
    ALTER TABLE option_products ADD COLUMN shipping_entity TEXT;
    COMMENT ON COLUMN option_products.shipping_entity IS '출고 주체 (자사/위탁)';
  END IF;
END $$;
