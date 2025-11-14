-- =====================================================
-- organizations 테이블 컬럼 순서 재정렬
-- =====================================================
-- 작성일: 2025-01-13
-- 설명: 유사한 속성별로 컬럼을 그룹핑하여 재정렬
--
-- 그룹 순서:
-- 1. 기본 식별 정보 (id, owner_id, is_active)
-- 2. 코드 정보 (seller_code, partner_code)
-- 3. 사업자 기본 정보 (business_name, business_number, business_address, business_email)
-- 4. 대표자 정보 (representative_name, representative_phone)
-- 5. 담당자 정보 (manager_name, manager_phone)
-- 6. 계좌 정보 (bank_account, depositor_name)
-- 7. 송장 정보 (store_name, store_phone)
-- 8. 티어 정보 (tier, tier_updated_at, is_manual_tier, manual_tier, manual_tier_set_by, manual_tier_set_at)
-- 9. 활동 통계 (accumulated_points, last_login_date, last_order_date, last_comment_date)
-- 10. 메타 정보 (memo, created_at, updated_at)
-- =====================================================

-- 기존 테이블 백업
ALTER TABLE organizations RENAME TO organizations_old;

-- 새 테이블 생성 (컬럼 순서 재정렬)
CREATE TABLE organizations (
  -- 1. 기본 식별 정보
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,

  -- 2. 코드 정보
  seller_code text UNIQUE,
  partner_code text UNIQUE,

  -- 3. 사업자 기본 정보
  business_name text,
  business_number text,
  business_address text,
  business_email text,

  -- 4. 대표자 정보
  representative_name text,
  representative_phone text,

  -- 5. 담당자 정보
  manager_name text,
  manager_phone text,

  -- 6. 계좌 정보
  bank_account text,
  depositor_name text,

  -- 7. 송장 정보
  store_name text,
  store_phone text,

  -- 8. 티어 정보
  tier text,
  tier_updated_at timestamptz,
  is_manual_tier boolean DEFAULT false,
  manual_tier text,
  manual_tier_set_by uuid REFERENCES users(id),
  manual_tier_set_at timestamptz,

  -- 9. 활동 통계
  accumulated_points integer DEFAULT 0,
  last_login_date date,
  last_order_date date,
  last_comment_date date,

  -- 10. 메타 정보
  memo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 데이터 마이그레이션
INSERT INTO organizations (
  id, owner_id, is_active,
  seller_code, partner_code,
  business_name, business_number, business_address, business_email,
  representative_name, representative_phone,
  manager_name, manager_phone,
  bank_account, depositor_name,
  store_name, store_phone,
  tier, tier_updated_at, is_manual_tier, manual_tier, manual_tier_set_by, manual_tier_set_at,
  accumulated_points, last_login_date, last_order_date, last_comment_date,
  memo, created_at, updated_at
)
SELECT
  id, owner_id, is_active,
  seller_code, partner_code,
  business_name, business_number, business_address, business_email,
  representative_name, representative_phone,
  manager_name, manager_phone,
  bank_account, depositor_name,
  store_name, store_phone,
  tier, tier_updated_at, is_manual_tier, manual_tier, manual_tier_set_by, manual_tier_set_at,
  accumulated_points, last_login_date, last_order_date, last_comment_date,
  memo, created_at, updated_at
FROM organizations_old;

-- 기존 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_seller_code ON organizations(seller_code);
CREATE INDEX IF NOT EXISTS idx_organizations_partner_code ON organizations(partner_code);
CREATE INDEX IF NOT EXISTS idx_organizations_tier ON organizations(tier);

-- RLS 정책 재생성 (기존 정책 확인 후 동일하게 적용)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 외래키 제약조건 재생성
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_primary_organization_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_primary_organization_id_fkey
  FOREIGN KEY (primary_organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE organization_cash_history DROP CONSTRAINT IF EXISTS user_cash_history_organization_id_fkey;
ALTER TABLE organization_cash_history ADD CONSTRAINT user_cash_history_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_credits_history DROP CONSTRAINT IF EXISTS user_credits_history_organization_id_fkey;
ALTER TABLE organization_credits_history ADD CONSTRAINT user_credits_history_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE seller_performance_daily DROP CONSTRAINT IF EXISTS seller_performance_daily_organization_id_fkey;
ALTER TABLE seller_performance_daily ADD CONSTRAINT seller_performance_daily_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE seller_rankings DROP CONSTRAINT IF EXISTS seller_rankings_organization_id_fkey;
ALTER TABLE seller_rankings ADD CONSTRAINT seller_rankings_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE seller_badges DROP CONSTRAINT IF EXISTS seller_badges_organization_id_fkey;
ALTER TABLE seller_badges ADD CONSTRAINT seller_badges_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE option_name_mappings DROP CONSTRAINT IF EXISTS option_name_mappings_organization_id_fkey;
ALTER TABLE option_name_mappings ADD CONSTRAINT option_name_mappings_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_credit_transactions DROP CONSTRAINT IF EXISTS user_credit_transactions_organization_id_fkey;
ALTER TABLE organization_credit_transactions ADD CONSTRAINT user_credit_transactions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_cash_transactions DROP CONSTRAINT IF EXISTS user_cash_transactions_organization_id_fkey;
ALTER TABLE organization_cash_transactions ADD CONSTRAINT user_cash_transactions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_credits DROP CONSTRAINT IF EXISTS user_credits_organization_id_fkey;
ALTER TABLE organization_credits ADD CONSTRAINT user_credits_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_cash DROP CONSTRAINT IF EXISTS user_cash_organization_id_fkey;
ALTER TABLE organization_cash ADD CONSTRAINT user_cash_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE business_profiles DROP CONSTRAINT IF EXISTS business_profiles_organization_id_fkey;
ALTER TABLE business_profiles ADD CONSTRAINT business_profiles_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE settlements DROP CONSTRAINT IF EXISTS settlements_organization_id_fkey;
ALTER TABLE settlements ADD CONSTRAINT settlements_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE integrated_orders DROP CONSTRAINT IF EXISTS integrated_orders_organization_id_fkey;
ALTER TABLE integrated_orders ADD CONSTRAINT integrated_orders_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;
ALTER TABLE organization_invitations ADD CONSTRAINT organization_invitations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_daily_rewards DROP CONSTRAINT IF EXISTS organization_daily_rewards_organization_id_fkey;
ALTER TABLE organization_daily_rewards ADD CONSTRAINT organization_daily_rewards_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE sub_accounts DROP CONSTRAINT IF EXISTS sub_accounts_organization_id_fkey;
ALTER TABLE sub_accounts ADD CONSTRAINT sub_accounts_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 기존 테이블 삭제 (CASCADE로 남은 의존성 모두 제거)
DROP TABLE IF EXISTS organizations_old CASCADE;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations 테이블 컬럼 순서 재정렬 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '그룹별 컬럼 순서:';
  RAISE NOTICE '1. 기본 식별 (id, owner_id, is_active)';
  RAISE NOTICE '2. 코드 (seller_code, partner_code)';
  RAISE NOTICE '3. 사업자 정보 (business_name, business_number, business_address, business_email)';
  RAISE NOTICE '4. 대표자 (representative_name, representative_phone)';
  RAISE NOTICE '5. 담당자 (manager_name, manager_phone)';
  RAISE NOTICE '6. 계좌 (bank_account, depositor_name)';
  RAISE NOTICE '7. 송장 (store_name, store_phone)';
  RAISE NOTICE '8. 티어 (tier, tier_updated_at, is_manual_tier, manual_tier, manual_tier_set_by, manual_tier_set_at)';
  RAISE NOTICE '9. 활동 통계 (accumulated_points, last_login_date, last_order_date, last_comment_date)';
  RAISE NOTICE '10. 메타 (memo, created_at, updated_at)';
  RAISE NOTICE '=================================================';
END $$;
