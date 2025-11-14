-- integrated_orders 테이블에 cash_used 컬럼 추가
-- 발주확정 시 사용한 캐시 금액 저장

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS cash_used NUMERIC DEFAULT 0;

COMMENT ON COLUMN integrated_orders.cash_used IS '발주확정 시 사용한 캐시 금액';
