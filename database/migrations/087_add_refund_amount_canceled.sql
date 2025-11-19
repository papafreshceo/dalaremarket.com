-- Migration 087: Add refund_amount_canceled columns to integrated_orders
-- 환불금액(취소) 및 환불일시 저장을 위한 컬럼 추가

-- refund_amount_canceled 컬럼 추가 (환불완료 시 환불된 금액)
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS refund_amount_canceled DECIMAL(12, 2) DEFAULT 0;

-- refund_amount_canceled_at 컬럼 추가 (환불금액 기록 일시)
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS refund_amount_canceled_at TIMESTAMPTZ;

-- 인덱스 추가 (환불 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_refund_amount
ON integrated_orders(refund_amount_canceled)
WHERE refund_amount_canceled > 0;

CREATE INDEX IF NOT EXISTS idx_integrated_orders_refund_canceled_at
ON integrated_orders(refund_amount_canceled_at)
WHERE refund_amount_canceled_at IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.refund_amount_canceled IS '환불완료 시 환불된 금액 (캐시 환불액)';
COMMENT ON COLUMN integrated_orders.refund_amount_canceled_at IS '환불금액 기록 일시';
