-- integrated_orders 테이블에 final_deposit_amount 컬럼 추가
-- 발주확정 시 캐시 차감 후 실제 입금해야 할 금액

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS final_deposit_amount NUMERIC DEFAULT 0;

COMMENT ON COLUMN integrated_orders.final_deposit_amount IS '캐시 차감 후 실제 입금액 (settlement_amount - cash_used)';
