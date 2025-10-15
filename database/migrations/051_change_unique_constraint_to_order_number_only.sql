-- =====================================================
-- integrated_orders UNIQUE 제약조건 변경
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: 중복 판단을 주문번호만으로 변경
-- =====================================================

-- 기존 UNIQUE 제약조건 삭제
ALTER TABLE integrated_orders
  DROP CONSTRAINT IF EXISTS integrated_orders_unique_order;

-- 새 UNIQUE 제약조건 추가 (주문번호만)
ALTER TABLE integrated_orders
  ADD CONSTRAINT integrated_orders_unique_order_number
  UNIQUE (order_number);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders UNIQUE 제약조건 변경 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 전: (market_name, order_number, option_name)';
  RAISE NOTICE '변경 후: (order_number)';
  RAISE NOTICE '=================================================';
END $$;
