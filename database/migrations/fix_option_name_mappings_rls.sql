-- =====================================================
-- option_name_mappings RLS 정책 수정
-- =====================================================
-- 작성일: 2025-11-15
-- 설명: organization_members 테이블 의존성 제거
--       users.primary_organization_id 기반으로 변경
-- =====================================================

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Organization members can view organization option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can create option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can update option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can delete option mappings" ON option_name_mappings;

-- 2. 새로운 RLS 정책 생성 (users.primary_organization_id 기반)

-- 조회: 본인 조직의 매핑 조회 가능
CREATE POLICY "Users can view their organization option mappings"
  ON option_name_mappings FOR SELECT
  USING (
    organization_id = (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- 생성: 본인 조직의 매핑 생성 가능
CREATE POLICY "Users can create option mappings for their organization"
  ON option_name_mappings FOR INSERT
  WITH CHECK (
    organization_id = (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- 수정: 본인 조직의 매핑 수정 가능
CREATE POLICY "Users can update their organization option mappings"
  ON option_name_mappings FOR UPDATE
  USING (
    organization_id = (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- 삭제: 본인 조직의 매핑 삭제 가능
CREATE POLICY "Users can delete their organization option mappings"
  ON option_name_mappings FOR DELETE
  USING (
    organization_id = (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ option_name_mappings RLS 정책 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- organization_members 테이블 의존성 제거';
  RAISE NOTICE '- users.primary_organization_id 기반으로 변경';
  RAISE NOTICE '- 모든 조직 사용자가 매핑 CRUD 가능';
  RAISE NOTICE '=================================================';
END $$;
