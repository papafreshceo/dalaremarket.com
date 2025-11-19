-- 주문 테이블에 batch_id 추가
-- 한 번의 업로드로 등록된 주문들을 그룹화하기 위한 필드

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS batch_id UUID;

-- batch_id 인덱스 추가 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_batch_id
ON integrated_orders(batch_id);

-- batch_id와 created_at 복합 인덱스 (배치별 시간순 정렬을 위해)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_batch_created
ON integrated_orders(batch_id, created_at);

COMMENT ON COLUMN integrated_orders.batch_id IS '한 번의 업로드로 등록된 주문들의 그룹 ID';
