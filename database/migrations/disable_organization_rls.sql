-- =====================================================
-- 조직 관련 테이블 RLS 비활성화
-- =====================================================
-- 작성일: 2025-11-11
-- 목적: 무한 재귀 오류 해결을 위해 RLS 완전 비활성화
-- 보안: API 레벨에서 권한 체크 수행
-- =====================================================

-- organization_members 테이블의 RLS 완전 비활성화
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- organizations 테이블의 RLS도 비활성화
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- organization_invitations 테이블의 RLS도 비활성화
ALTER TABLE organization_invitations DISABLE ROW LEVEL SECURITY;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 조직 관련 테이블 RLS 비활성화 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. organizations - RLS 비활성화';
  RAISE NOTICE '2. organization_members - RLS 비활성화';
  RAISE NOTICE '3. organization_invitations - RLS 비활성화';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '⚠️ 주의: API 레벨에서 권한 체크 필수';
  RAISE NOTICE '=================================================';
END $$;
