-- integrated_orders 테이블에 depositor_name 컬럼 추가
-- 배치별로 입금자명을 저장하기 위한 컬럼

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS depositor_name TEXT;

COMMENT ON COLUMN integrated_orders.depositor_name IS '입금자명 (배치별로 저장)';
