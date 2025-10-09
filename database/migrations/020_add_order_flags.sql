-- integrated_orders 테이블에 발주확인, 송장등록 플래그 추가

-- 발주확인 플래그 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS order_confirmed BOOLEAN DEFAULT FALSE;

-- 송장등록 플래그 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS invoice_registered BOOLEAN DEFAULT FALSE;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_integrated_orders_order_confirmed ON integrated_orders(order_confirmed);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_invoice_registered ON integrated_orders(invoice_registered);

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.order_confirmed IS '발주확인 여부';
COMMENT ON COLUMN integrated_orders.invoice_registered IS '송장등록 여부';
