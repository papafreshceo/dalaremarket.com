-- cs_records 테이블에 주문자 전화번호 컬럼 추가
ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS orderer_phone VARCHAR(20);

-- 인덱스 생성 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_cs_records_orderer_phone
ON cs_records(orderer_phone);

-- 기존 데이터에 대해 integrated_orders에서 buyer_phone 가져와서 업데이트
UPDATE cs_records cs
SET orderer_phone = io.buyer_phone
FROM integrated_orders io
WHERE cs.order_id = io.id
  AND cs.orderer_phone IS NULL
  AND io.buyer_phone IS NOT NULL;
