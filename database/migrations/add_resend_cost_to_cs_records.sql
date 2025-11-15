-- cs_records 테이블에 재발송비용 컬럼 추가
ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS resend_cost NUMERIC(12, 2);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cs_records_resend_cost
ON cs_records(resend_cost);

-- 코멘트 추가
COMMENT ON COLUMN cs_records.resend_cost IS '재발송비용 (재발송상품의 셀러공급가 * 수량)';
