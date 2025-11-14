-- =====================================================
-- organizations 테이블 RLS 정책 수정
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: 조직 멤버가 자신이 속한 조직 정보를 조회할 수 있도록 수정
-- =====================================================

-- 기존 조회 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;

-- 조직 멤버가 자신이 속한 조직을 조회할 수 있는 정책 생성
CREATE POLICY "Members can view their organizations"
  ON organizations FOR SELECT
  USING (
    -- 관리자는 모든 조직 조회 가능
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'super_admin', 'employee')
    )
    OR
    -- 조직 멤버는 자신이 속한 조직만 조회 가능
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations RLS 정책 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 조직 멤버가 자신이 속한 조직 정보 조회 가능';
  RAISE NOTICE '- 관리자는 모든 조직 조회 가능';
  RAISE NOTICE '=================================================';
END $$;
