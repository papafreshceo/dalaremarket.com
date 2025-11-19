-- 091: option_name_mappings RLS 정책 단순화
-- 조직 멤버 모두가 매핑 생성/수정/삭제 가능하도록 변경

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Organization members can view organization option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can create option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can update option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can delete option mappings" ON option_name_mappings;

-- 새로운 정책: 조직 멤버 모두가 조회 가능
CREATE POLICY "Organization members can view option mappings"
  ON option_name_mappings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 새로운 정책: 조직 멤버 모두가 생성 가능
CREATE POLICY "Organization members can create option mappings"
  ON option_name_mappings FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 새로운 정책: 조직 멤버 모두가 수정 가능
CREATE POLICY "Organization members can update option mappings"
  ON option_name_mappings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 새로운 정책: 조직 멤버 모두가 삭제 가능
CREATE POLICY "Organization members can delete option mappings"
  ON option_name_mappings FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'option_name_mappings RLS 정책 단순화 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 조직 멤버 모두가 매핑 생성/수정/삭제 가능';
  RAISE NOTICE '- 관리자 권한 제한 제거';
  RAISE NOTICE '=================================================';
END $$;
