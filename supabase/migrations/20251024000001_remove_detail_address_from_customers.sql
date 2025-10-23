-- customers 테이블에서 detail_address 칼럼 제거
ALTER TABLE customers DROP COLUMN IF EXISTS detail_address;

COMMENT ON TABLE customers IS '고객관리 테이블 (단골고객, 마케팅대상고객) - detail_address 제거됨';
