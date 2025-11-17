-- Migration 076: Add soft delete to organizations and organization_members
-- 조직 및 조직 멤버 soft delete 추가

-- =====================================================
-- 1. organizations 테이블에 soft delete 칼럼 추가
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE organizations ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_is_deleted ON organizations(is_deleted);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 2. organization_members 테이블에 soft delete 칼럼 추가
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organization_members_is_deleted ON organization_members(is_deleted);
CREATE INDEX IF NOT EXISTS idx_organization_members_deleted_at ON organization_members(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 3. sub_accounts 테이블에 soft delete 칼럼 추가
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sub_accounts' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE sub_accounts ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sub_accounts' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE sub_accounts ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sub_accounts_is_deleted ON sub_accounts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sub_accounts_deleted_at ON sub_accounts(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 4. organization_cash 테이블에 soft delete 칼럼 추가
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_cash' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE organization_cash ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_cash' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE organization_cash ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organization_cash_is_deleted ON organization_cash(is_deleted);
CREATE INDEX IF NOT EXISTS idx_organization_cash_deleted_at ON organization_cash(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 5. organization_credits 테이블에 soft delete 칼럼 추가
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_credits' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE organization_credits ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_credits' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE organization_credits ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organization_credits_is_deleted ON organization_credits(is_deleted);
CREATE INDEX IF NOT EXISTS idx_organization_credits_deleted_at ON organization_credits(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 6. 활성 데이터만 조회하는 뷰 생성
-- =====================================================
CREATE OR REPLACE VIEW active_organizations AS
SELECT *
FROM organizations
WHERE is_deleted = false;

CREATE OR REPLACE VIEW active_organization_members AS
SELECT *
FROM organization_members
WHERE is_deleted = false;

CREATE OR REPLACE VIEW active_sub_accounts AS
SELECT *
FROM sub_accounts
WHERE is_deleted = false;

CREATE OR REPLACE VIEW active_organization_cash AS
SELECT *
FROM organization_cash
WHERE is_deleted = false;

CREATE OR REPLACE VIEW active_organization_credits AS
SELECT *
FROM organization_credits
WHERE is_deleted = false;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 조직 soft delete 칼럼 추가 완료';
  RAISE NOTICE '  - organizations: deleted_at, is_deleted';
  RAISE NOTICE '  - organization_members: deleted_at, is_deleted';
  RAISE NOTICE '  - sub_accounts: deleted_at, is_deleted';
  RAISE NOTICE '  - organization_cash: deleted_at, is_deleted';
  RAISE NOTICE '  - organization_credits: deleted_at, is_deleted';
  RAISE NOTICE '  - 활성 데이터 뷰 생성 완료';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  캐시/크레딧 잔액 처리:';
  RAISE NOTICE '  - 조직 삭제 시 캐시/크레딧도 함께 삭제됨';
  RAISE NOTICE '  - 거래내역은 보존됨 (회계 감사용)';
END $$;
