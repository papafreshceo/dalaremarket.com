-- =====================================================
-- 조직 기반 시스템 마이그레이션 오류 일괄 수정
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: platform/orders 페이지 오류 수정을 위한 통합 마이그레이션
--       1. history 테이블 user_id 컬럼 제거
--       2. organizations 테이블 은행 필드 추가
-- =====================================================

-- =====================================================
-- 1. 히스토리 테이블의 user_id 컬럼 완전 삭제
-- =====================================================

-- organization_cash_history의 user_id 컬럼 삭제
ALTER TABLE organization_cash_history
DROP COLUMN IF EXISTS user_id CASCADE;

-- organization_credits_history의 user_id 컬럼 삭제
ALTER TABLE organization_credits_history
DROP COLUMN IF EXISTS user_id CASCADE;

-- =====================================================
-- 2. organizations 테이블에 은행 관련 필드 추가
-- =====================================================

-- bank_name 컬럼 추가 (은행명)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS bank_name text NULL;

-- account_holder 컬럼 추가 (예금주)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS account_holder text NULL;

-- depositor_name 컬럼 삭제 (중복 제거, account_holder로 통일)
ALTER TABLE organizations
DROP COLUMN IF EXISTS depositor_name;

-- =====================================================
-- 3. sub_accounts RLS 정책 수정 (멤버십 기반)
-- =====================================================

-- 기존 owner_id 기반 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view their organization's sub accounts" ON sub_accounts;
DROP POLICY IF EXISTS "Users can insert sub accounts for their organization" ON sub_accounts;
DROP POLICY IF EXISTS "Users can update their organization's sub accounts" ON sub_accounts;
DROP POLICY IF EXISTS "Users can delete their organization's sub accounts" ON sub_accounts;
DROP POLICY IF EXISTS "Admins can manage all sub accounts" ON sub_accounts;

-- 멤버십 기반 RLS 정책 생성
CREATE POLICY "Members can view their organization's sub accounts"
  ON sub_accounts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Members with permissions can insert sub accounts"
  ON sub_accounts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND (role = 'owner' OR can_manage_orders = true)
    )
  );

CREATE POLICY "Members with permissions can update sub accounts"
  ON sub_accounts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND (role = 'owner' OR can_manage_orders = true)
    )
  );

CREATE POLICY "Organization owners can delete sub accounts"
  ON sub_accounts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND role = 'owner'
    )
  );

CREATE POLICY "Admins can manage all sub accounts"
  ON sub_accounts FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'super_admin', 'employee')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'super_admin', 'employee')
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 조직 시스템 오류 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '수정 내역:';
  RAISE NOTICE '1. organization_cash_history.user_id 컬럼 삭제';
  RAISE NOTICE '2. organization_credits_history.user_id 컬럼 삭제';
  RAISE NOTICE '3. organizations.bank_name 컬럼 추가';
  RAISE NOTICE '4. organizations.account_holder 컬럼 추가';
  RAISE NOTICE '5. organizations.depositor_name 컬럼 삭제';
  RAISE NOTICE '6. sub_accounts RLS 정책 멤버십 기반으로 변경';
  RAISE NOTICE '=================================================';
END $$;
