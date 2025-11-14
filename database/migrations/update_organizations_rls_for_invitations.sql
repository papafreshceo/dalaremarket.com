-- =====================================================
-- organizations 테이블 RLS 정책 업데이트
-- 초대받은 사용자도 조직 정보 조회 가능하도록 수정
-- =====================================================
-- 작성일: 2025-01-13
-- 설명: 초대 수락 시 조직을 찾을 수 없는 문제 해결
-- =====================================================

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- 새로운 SELECT 정책 생성
-- 1. 멤버는 자신이 속한 조직 조회 가능
-- 2. 초대받은 사용자도 초대된 조직 조회 가능 (pending 상태의 초대만)
CREATE POLICY "Users can view their organization or invited organization"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
  OR
  id IN (
    SELECT organization_id
    FROM organization_invitations
    WHERE status = 'pending'
    AND (
      -- 이메일로 초대된 경우
      email = (SELECT email FROM users WHERE id = auth.uid())
      OR
      -- notification을 통해 확인된 경우 (user_id가 매칭되는 경우)
      id IN (
        SELECT (data->>'invitation_id')::uuid
        FROM notifications
        WHERE user_id = auth.uid()
        AND type = 'organization_invitation'
      )
    )
  )
);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations 테이블 RLS 정책 업데이트 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '- 초대받은 사용자도 조직 정보 조회 가능';
  RAISE NOTICE '- 초대 수락 시 "조직을 찾을 수 없습니다" 에러 해결';
  RAISE NOTICE '=================================================';
END $$;
