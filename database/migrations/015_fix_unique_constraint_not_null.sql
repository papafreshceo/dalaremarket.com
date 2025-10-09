-- =====================================================
-- integrated_orders UNIQUE 제약조건 수정
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: market_name, order_number, option_name을 NOT NULL로 변경
--       UNIQUE 제약조건이 null 값에서도 제대로 작동하도록 수정
-- =====================================================

-- 1단계: null 값 처리
UPDATE integrated_orders
SET market_name = COALESCE(market_name, 'UNKNOWN')
WHERE market_name IS NULL;

UPDATE integrated_orders
SET order_number = COALESCE(order_number, 'NO_ORDER_' || id::text)
WHERE order_number IS NULL;

UPDATE integrated_orders
SET option_name = COALESCE(option_name, 'NO_OPTION_' || id::text)
WHERE option_name IS NULL;

-- 2단계: 기존 UNIQUE 제약조건 삭제
ALTER TABLE integrated_orders
DROP CONSTRAINT IF EXISTS integrated_orders_unique_order;

-- 3단계: NOT NULL 제약조건 추가
ALTER TABLE integrated_orders
ALTER COLUMN market_name SET NOT NULL,
ALTER COLUMN order_number SET NOT NULL,
ALTER COLUMN option_name SET NOT NULL;

-- 4단계: UNIQUE 제약조건 재생성
ALTER TABLE integrated_orders
ADD CONSTRAINT integrated_orders_unique_order
UNIQUE (market_name, order_number, option_name);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders UNIQUE 제약조건 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'NULL 값 처리 완료';
  RAISE NOTICE 'market_name, order_number, option_name: NOT NULL 설정';
  RAISE NOTICE 'UNIQUE 제약조건 재생성 완료';
  RAISE NOTICE '=================================================';
END $$;
