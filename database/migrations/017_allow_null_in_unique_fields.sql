-- =====================================================
-- integrated_orders UNIQUE 필드 NULL 허용
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: market_name, order_number, option_name의 NOT NULL 제약조건 제거
--       주문번호가 없는 경우(CS발송, 전화주문 등) NULL 허용
-- =====================================================

-- NOT NULL 제약조건 제거
ALTER TABLE integrated_orders
ALTER COLUMN market_name DROP NOT NULL,
ALTER COLUMN order_number DROP NOT NULL,
ALTER COLUMN option_name DROP NOT NULL;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders NULL 허용 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'market_name, order_number, option_name: NULL 허용';
  RAISE NOTICE 'UNIQUE 제약조건은 유지 (null 값은 중복 체크 제외)';
  RAISE NOTICE '=================================================';
END $$;
