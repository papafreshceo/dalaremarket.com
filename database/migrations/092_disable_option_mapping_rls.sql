-- 092: option_name_mappings RLS 완전 비활성화
-- 개발 단계에서 RLS로 인한 문제 해결

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Organization members can view organization option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can create option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can update option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization admins can delete option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization members can view option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization members can create option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization members can update option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Organization members can delete option mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can view their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can create their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can update their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can delete their own option name mappings" ON option_name_mappings;

-- RLS 비활성화
ALTER TABLE option_name_mappings DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE option_name_mappings IS '옵션명 매핑 테이블 (RLS 비활성화됨)';
