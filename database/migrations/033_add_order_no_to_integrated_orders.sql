-- =====================================================
-- integrated_orders 테이블에 발주번호(order_no) 컬럼 추가
-- =====================================================

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS order_no VARCHAR(50);

COMMENT ON COLUMN integrated_orders.order_no IS '발주번호 - 사용자별 고유 발주번호 (이메일앞2글자+날짜+순번)';

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_order_no ON integrated_orders(order_no);
