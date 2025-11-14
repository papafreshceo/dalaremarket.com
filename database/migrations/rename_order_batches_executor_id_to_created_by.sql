-- order_batches 테이블의 executor_id 컬럼을 created_by로 변경

ALTER TABLE order_batches
RENAME COLUMN executor_id TO created_by;

-- 인덱스 이름도 변경
DROP INDEX IF EXISTS idx_order_batches_executor_id;
CREATE INDEX IF NOT EXISTS idx_order_batches_created_by ON order_batches(created_by);

-- 코멘트 업데이트
COMMENT ON COLUMN order_batches.created_by IS '발주확정 실행자 ID';
