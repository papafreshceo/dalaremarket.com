-- cs_records 테이블에 원주문 상세 정보 컬럼 추가
-- 이를 통해 CS 접수 시점의 주문 정보를 스냅샷으로 저장

-- 주문 날짜 정보
ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS sheet_date DATE;

-- 배송/출하 정보
ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS shipping_source VARCHAR(100);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(100);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(12, 2);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS shipped_date DATE;

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS courier_company VARCHAR(50);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- 정산/금액 정보
ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS seller_supply_price NUMERIC(12, 2);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS settlement_amount NUMERIC(12, 2);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS cash_used NUMERIC(12, 2);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS final_deposit_amount NUMERIC(12, 2);

-- 조직/계정 정보
ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS sub_account_id UUID;

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS depositor_name VARCHAR(100);

ALTER TABLE cs_records
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 인덱스 생성 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_cs_records_sheet_date
ON cs_records(sheet_date DESC);

CREATE INDEX IF NOT EXISTS idx_cs_records_shipped_date
ON cs_records(shipped_date DESC);

CREATE INDEX IF NOT EXISTS idx_cs_records_organization_id
ON cs_records(organization_id);

CREATE INDEX IF NOT EXISTS idx_cs_records_sub_account_id
ON cs_records(sub_account_id);

CREATE INDEX IF NOT EXISTS idx_cs_records_vendor_name
ON cs_records(vendor_name);

CREATE INDEX IF NOT EXISTS idx_cs_records_shipping_source
ON cs_records(shipping_source);

-- 외래 키 제약 조건 추가 (이미 존재할 수 있으므로 에러 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cs_records_organization'
  ) THEN
    ALTER TABLE cs_records
    ADD CONSTRAINT fk_cs_records_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cs_records_sub_account'
  ) THEN
    ALTER TABLE cs_records
    ADD CONSTRAINT fk_cs_records_sub_account
    FOREIGN KEY (sub_account_id) REFERENCES sub_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 기존 CS 기록에 대해 integrated_orders에서 데이터 가져와서 업데이트
-- VARCHAR → NUMERIC/DATE 타입 변환 포함
UPDATE cs_records cs
SET
  sheet_date = io.sheet_date,
  shipping_source = io.shipping_source,
  vendor_name = io.vendor_name,
  shipping_cost = CASE
    WHEN io.shipping_cost ~ '^[0-9]+\.?[0-9]*$' THEN io.shipping_cost::NUMERIC
    ELSE NULL
  END,
  shipped_date = CASE
    WHEN io.shipped_date ~ '^\d{4}-\d{2}-\d{2}$' THEN io.shipped_date::DATE
    ELSE NULL
  END,
  courier_company = io.courier_company,
  tracking_number = io.tracking_number,
  seller_supply_price = CASE
    WHEN io.seller_supply_price ~ '^[0-9]+\.?[0-9]*$' THEN io.seller_supply_price::NUMERIC
    ELSE NULL
  END,
  settlement_amount = CASE
    WHEN io.settlement_amount ~ '^[0-9]+\.?[0-9]*$' THEN io.settlement_amount::NUMERIC
    ELSE NULL
  END,
  cash_used = io.cash_used,
  final_deposit_amount = io.final_deposit_amount,
  sub_account_id = io.sub_account_id,
  depositor_name = io.depositor_name,
  organization_id = io.organization_id
FROM integrated_orders io
WHERE cs.order_id = io.id
  AND cs.sheet_date IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN cs_records.sheet_date IS 'CS 접수 시점의 주문 시트 날짜';
COMMENT ON COLUMN cs_records.shipping_source IS 'CS 접수 시점의 출고처';
COMMENT ON COLUMN cs_records.vendor_name IS 'CS 접수 시점의 벤더사';
COMMENT ON COLUMN cs_records.shipping_cost IS 'CS 접수 시점의 배송비';
COMMENT ON COLUMN cs_records.shipped_date IS 'CS 접수 시점의 발송일';
COMMENT ON COLUMN cs_records.courier_company IS 'CS 접수 시점의 택배사';
COMMENT ON COLUMN cs_records.tracking_number IS 'CS 접수 시점의 송장번호';
COMMENT ON COLUMN cs_records.seller_supply_price IS 'CS 접수 시점의 셀러 공급가';
COMMENT ON COLUMN cs_records.settlement_amount IS 'CS 접수 시점의 정산금액';
COMMENT ON COLUMN cs_records.cash_used IS 'CS 접수 시점의 캐시 사용액';
COMMENT ON COLUMN cs_records.final_deposit_amount IS 'CS 접수 시점의 최종 입금액';
COMMENT ON COLUMN cs_records.sub_account_id IS 'CS 접수 시점의 서브 계정 ID';
COMMENT ON COLUMN cs_records.depositor_name IS 'CS 접수 시점의 입금자명';
COMMENT ON COLUMN cs_records.organization_id IS 'CS 접수 시점의 조직 ID';
