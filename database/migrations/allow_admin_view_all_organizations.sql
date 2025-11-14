-- =====================================================
-- organizations 테이블 RLS 정책 수정: 관리자 전체 조회 허용
-- =====================================================

-- 기존 조회 정책 삭제
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- 새로운 조회 정책: 관리자는 모든 조직 조회 가능, 일반 유저는 자신의 조직만
CREATE POLICY "Users can view organizations"
ON organizations FOR SELECT
USING (
  -- 관리자 그룹(super_admin, admin, employee)은 모든 조직 조회 가능
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'employee')
  )
  OR
  -- 일반 유저는 자신이 속한 조직만 조회 가능
  id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ organizations RLS 정책 수정 완료';
  RAISE NOTICE '- 관리자(super_admin, admin, employee): 모든 조직 조회 가능';
  RAISE NOTICE '- 일반 유저: 자신이 속한 조직만 조회 가능';
END $$;
