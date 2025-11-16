-- =====================================================
-- organizations 테이블 RLS 설정 (메시지 시스템용)
-- =====================================================
-- 인증된 사용자들이 다른 사용자의 조직 정보를 볼 수 있어야 합니다.

-- 기존 정책 확인 및 추가
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON organizations;
CREATE POLICY "Authenticated users can view organizations" ON organizations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
