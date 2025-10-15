-- 053_fix_updated_at_to_korean_time.sql
-- updated_at 트리거를 한국 시간(UTC+9)으로 변경

-- 기존 트리거 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 한국 시간을 반환하는 새로운 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- 한국 시간 (UTC+9) 설정
  NEW.updated_at = NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 트리거 재생성
DROP TRIGGER IF EXISTS trigger_update_integrated_orders_updated_at ON integrated_orders;
CREATE TRIGGER trigger_update_integrated_orders_updated_at
  BEFORE UPDATE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_product_mapping_updated_at ON product_mapping;
CREATE TRIGGER trigger_update_product_mapping_updated_at
  BEFORE UPDATE ON product_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_cs_records_updated_at ON cs_records;
CREATE TRIGGER trigger_update_cs_records_updated_at
  BEFORE UPDATE ON cs_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_regular_customers_updated_at ON regular_customers;
CREATE TRIGGER trigger_update_regular_customers_updated_at
  BEFORE UPDATE ON regular_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sms_marketing_updated_at ON sms_marketing_targets;
CREATE TRIGGER trigger_update_sms_marketing_updated_at
  BEFORE UPDATE ON sms_marketing_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_market_templates_updated_at ON market_upload_templates;
CREATE TRIGGER trigger_update_market_templates_updated_at
  BEFORE UPDATE ON market_upload_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_courier_templates_updated_at ON courier_templates;
CREATE TRIGGER trigger_update_courier_templates_updated_at
  BEFORE UPDATE ON courier_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_vendor_templates_updated_at ON vendor_templates;
CREATE TRIGGER trigger_update_vendor_templates_updated_at
  BEFORE UPDATE ON vendor_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기존 updated_at 컬럼의 기본값도 한국 시간으로 변경
ALTER TABLE integrated_orders ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
ALTER TABLE product_mapping ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
ALTER TABLE cs_records ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
ALTER TABLE regular_customers ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
ALTER TABLE sms_marketing_targets ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
ALTER TABLE market_upload_templates ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
ALTER TABLE courier_templates ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
ALTER TABLE vendor_templates ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC' + INTERVAL '9 hours');
