-- =====================================================
-- organization_cash, organization_credits RLS 정책 수정
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: 관리자와 조직 멤버가 캐시/크레딧 조회 가능하도록 RLS 정책 추가
-- =====================================================

-- organization_cash RLS 정책
DROP POLICY IF EXISTS "organization_cash_select_policy" ON organization_cash;

CREATE POLICY "organization_cash_select_policy"
ON organization_cash
FOR SELECT
USING (
  -- 관리자는 모든 조직의 캐시 조회 가능
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  -- 조직 멤버는 자신이 속한 조직의 캐시 조회 가능
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_cash.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  -- 조직 소유자는 자신의 조직 캐시 조회 가능
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_cash.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

-- organization_credits RLS 정책
DROP POLICY IF EXISTS "organization_credits_select_policy" ON organization_credits;

CREATE POLICY "organization_credits_select_policy"
ON organization_credits
FOR SELECT
USING (
  -- 관리자는 모든 조직의 크레딧 조회 가능
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  -- 조직 멤버는 자신이 속한 조직의 크레딧 조회 가능
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_credits.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  -- 조직 소유자는 자신의 조직 크레딧 조회 가능
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_credits.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organization_cash, organization_credits RLS 정책 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. 관리자(super_admin, admin, employee)는 모든 조직 캐시/크레딧 조회 가능';
  RAISE NOTICE '2. 조직 멤버는 자신이 속한 조직의 캐시/크레딧 조회 가능';
  RAISE NOTICE '3. 조직 소유자는 자신의 조직 캐시/크레딧 조회 가능';
  RAISE NOTICE '=================================================';
END $$;
