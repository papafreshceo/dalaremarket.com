-- =====================================================
-- integrated_orders UNIQUE 제약조건 변경
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: 주문번호가 없는 경우에도 중복 검사
--       market_name + order_number + buyer_name + recipient_name + option_name + quantity로 고유성 판단
-- =====================================================

-- 기존 UNIQUE 제약조건 삭제
ALTER TABLE integrated_orders
DROP CONSTRAINT IF EXISTS integrated_orders_unique_order;

-- 새로운 UNIQUE 제약조건 추가 (NULL도 중복 검사)
ALTER TABLE integrated_orders
ADD CONSTRAINT integrated_orders_unique_order
UNIQUE NULLS NOT DISTINCT (market_name, order_number, buyer_name, recipient_name, option_name, quantity);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders UNIQUE 제약조건 변경 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '고유 키: market_name + order_number + buyer_name + recipient_name + option_name + quantity';
  RAISE NOTICE '주문번호가 없어도 다른 필드 조합으로 중복 검사';
  RAISE NOTICE '=================================================';
END $$;
