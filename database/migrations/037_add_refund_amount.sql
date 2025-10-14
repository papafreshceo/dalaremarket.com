-- =====================================================
-- integrated_orders 환불 금액 필드 추가
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: 환불 처리 시 환불 금액을 저장하기 위한 필드 추가
-- =====================================================

-- 환불 금액 필드 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.refund_amount IS '환불 금액 - 취소 주문에 대한 실제 환불 금액';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '환불 금액 필드 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'refund_amount: 환불 금액 (DECIMAL)';
  RAISE NOTICE '=================================================';
END $$;
