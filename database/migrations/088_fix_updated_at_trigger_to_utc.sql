-- =====================================================
-- created_at, updated_at을 UTC 기준으로 수정
-- =====================================================
-- 작성일: 2025-11-19
-- 설명: NOW() 대신 명시적으로 UTC 시간을 사용하도록 수정
-- 이유: NOW()는 서버의 시간대 설정을 따르기 때문에
--       서버가 KST로 설정되어 있으면 한국 시간으로 저장됨
-- =====================================================

-- 1. integrated_orders 테이블의 기본값을 UTC로 변경
ALTER TABLE integrated_orders
  ALTER COLUMN created_at SET DEFAULT (timezone('UTC', now())),
  ALTER COLUMN updated_at SET DEFAULT (timezone('UTC', now()));

-- 2. 기존 트리거 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- UTC 기준으로 updated_at을 설정하는 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- timezone('UTC', now())를 사용하여 명시적으로 UTC 시간 저장
  NEW.updated_at = timezone('UTC', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 트리거 재생성
-- integrated_orders
DROP TRIGGER IF EXISTS trigger_update_integrated_orders_updated_at ON integrated_orders;
CREATE TRIGGER trigger_update_integrated_orders_updated_at
  BEFORE UPDATE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- mapping_settings
DROP TRIGGER IF EXISTS update_mapping_settings_updated_at ON mapping_settings;
CREATE TRIGGER update_mapping_settings_updated_at
  BEFORE UPDATE ON mapping_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- market_upload_templates
DROP TRIGGER IF EXISTS trigger_update_market_templates_updated_at ON market_upload_templates;
CREATE TRIGGER trigger_update_market_templates_updated_at
  BEFORE UPDATE ON market_upload_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- vendor_templates
DROP TRIGGER IF EXISTS trigger_update_vendor_templates_updated_at ON vendor_templates;
CREATE TRIGGER trigger_update_vendor_templates_updated_at
  BEFORE UPDATE ON vendor_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- option_products
DROP TRIGGER IF EXISTS trigger_update_option_products_updated_at ON option_products;
CREATE TRIGGER trigger_update_option_products_updated_at
  BEFORE UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- organization_members
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기타 테이블들 (필요한 경우 추가)

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Migration 088 completed: updated_at trigger function fixed to use UTC timezone';
END $$;
