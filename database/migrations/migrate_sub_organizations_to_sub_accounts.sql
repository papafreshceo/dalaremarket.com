-- =====================================================
-- 기존 서브 조직을 sub_accounts로 마이그레이션
-- =====================================================
-- 작성일: 2025-11-13
-- 설명:
--   - organizations의 서브 조직(is_main=false) 데이터를 sub_accounts로 이동
--   - organizations에서 서브 조직 삭제
--   - is_main, parent_organization_id 컬럼 제거
--   - idx_one_organization_per_owner 인덱스 생성 (한 소유자당 조직 1개)
-- =====================================================

-- 1. 기존 서브 조직 데이터를 sub_accounts로 이동
INSERT INTO sub_accounts (
  id,
  organization_id,
  business_name,
  business_number,
  representative_name,
  address,
  email,
  phone,
  fax,
  bank_name,
  account_number,
  account_holder,
  created_at,
  is_active
)
SELECT
  o.id,
  o.parent_organization_id, -- 메인 조직 ID
  o.business_name,
  o.business_number,
  o.representative_name,
  o.address,
  o.email,
  o.phone,
  o.fax,
  o.bank_name,
  o.account_number,
  o.account_holder,
  o.created_at,
  o.is_active
FROM organizations o
WHERE o.is_main = false AND o.parent_organization_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2. 마이그레이션 결과 확인
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM sub_accounts;
  RAISE NOTICE '✅ % 개의 서브 조직이 sub_accounts로 이동되었습니다.', migrated_count;
END $$;

-- 3. organizations에서 서브 조직 삭제
DELETE FROM organizations
WHERE is_main = false OR parent_organization_id IS NOT NULL;

-- 4. 불필요한 컬럼 제거
ALTER TABLE organizations
DROP COLUMN IF EXISTS is_main,
DROP COLUMN IF EXISTS parent_organization_id;

-- 5. 관련 인덱스 제거
DROP INDEX IF EXISTS idx_organizations_parent_id;
DROP INDEX IF EXISTS idx_organizations_is_main;
DROP INDEX IF EXISTS idx_one_main_per_owner;

-- 6. 제약 조건 제거
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS check_sub_has_parent;

-- 7. 한 소유자당 조직 1개만 허용하는 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_organization_per_owner
ON organizations(owner_id);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  org_count INTEGER;
  sub_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO sub_count FROM sub_accounts;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 마이그레이션 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '결과:';
  RAISE NOTICE '- organizations: % 개 (메인 계정만)', org_count;
  RAISE NOTICE '- sub_accounts: % 개 (정산용 사업자)', sub_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 서브 조직 → sub_accounts 테이블로 이동';
  RAISE NOTICE '- is_main, parent_organization_id 컬럼 제거';
  RAISE NOTICE '- 한 소유자당 조직 1개만 허용';
  RAISE NOTICE '=================================================';
END $$;
