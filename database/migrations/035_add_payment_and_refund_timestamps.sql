-- Add payment_confirmed_at and refund_processed_at columns to integrated_orders table

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN integrated_orders.payment_confirmed_at IS '입금확인 일시 - 셀러의 주문이 접수에서 결제완료로 변경된 시점';
COMMENT ON COLUMN integrated_orders.refund_processed_at IS '환불처리 일시 - 셀러의 취소요청 주문에 대한 환불 처리가 완료된 시점';
