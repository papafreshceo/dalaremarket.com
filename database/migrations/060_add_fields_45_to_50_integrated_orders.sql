-- integrated_orders 테이블에 field_45 ~ field_50 추가
-- 묶음배송번호 등 추가 필드를 위한 확장

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS field_45 TEXT,
ADD COLUMN IF NOT EXISTS field_46 TEXT,
ADD COLUMN IF NOT EXISTS field_47 TEXT,
ADD COLUMN IF NOT EXISTS field_48 TEXT,
ADD COLUMN IF NOT EXISTS field_49 TEXT,
ADD COLUMN IF NOT EXISTS field_50 TEXT;

-- 인덱스 추가 (필요시 - 묶음배송번호 등 검색용)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_field_45 ON integrated_orders(field_45);

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.field_45 IS '추가필드1 (예: 묶음배송번호)';
COMMENT ON COLUMN integrated_orders.field_46 IS '추가필드2';
COMMENT ON COLUMN integrated_orders.field_47 IS '추가필드3';
COMMENT ON COLUMN integrated_orders.field_48 IS '추가필드4';
COMMENT ON COLUMN integrated_orders.field_49 IS '추가필드5';
COMMENT ON COLUMN integrated_orders.field_50 IS '추가필드6';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders 테이블에 field_45~50 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
END $$;
