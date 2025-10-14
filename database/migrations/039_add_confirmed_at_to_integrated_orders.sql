-- 039_add_confirmed_at_to_integrated_orders.sql
-- 발주확정일시 칼럼 추가

-- integrated_orders 테이블에 confirmed_at 칼럼 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 기존 데이터 중 발주서확정 상태인 건들에 대해 created_at을 confirmed_at으로 복사 (임시)
UPDATE integrated_orders
SET confirmed_at = created_at
WHERE shipping_status IN ('발주서확정', '상품준비중', '배송중', '배송완료')
  AND confirmed_at IS NULL;

COMMENT ON COLUMN integrated_orders.confirmed_at IS '발주확정일시 (셀러가 발주서를 확정한 시간)';
