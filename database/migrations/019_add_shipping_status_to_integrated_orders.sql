-- =====================================================
-- integrated_orders 테이블에 배송상태, CS상태, 메모 필드 추가
-- =====================================================

-- 배송상태 필드 추가 (결제완료 -> 상품준비중 -> 배송중 -> 배송완료)
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(20) DEFAULT '결제완료';

-- CS상태 필드 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS cs_status VARCHAR(50);

-- 메모 필드 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_integrated_orders_shipping_status ON integrated_orders(shipping_status);

COMMENT ON COLUMN integrated_orders.shipping_status IS '배송상태 (결제완료/상품준비중/배송중/배송완료)';
COMMENT ON COLUMN integrated_orders.cs_status IS 'CS 상태';
COMMENT ON COLUMN integrated_orders.memo IS '메모';
