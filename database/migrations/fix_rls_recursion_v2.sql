-- =====================================================
-- RLS 무한 재귀 완전 수정 (v2)
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: RLS 정책 완전 재설정 및 캐시 초기화
-- =====================================================

-- 1. organization_members 테이블의 RLS 완전 비활성화 및 재활성화
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 2. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "조직 멤버는 같은 조직의 멤버 정보 조회 가능" ON organization_members;
DROP POLICY IF EXISTS "조직 관리자는 멤버 관리 가능" ON organization_members;
DROP POLICY IF EXISTS "Enable read access for organization members" ON organization_members;
DROP POLICY IF EXISTS "Enable insert for organization members" ON organization_members;
DROP POLICY IF EXISTS "Enable update for organization members" ON organization_members;
DROP POLICY IF EXISTS "Enable delete for organization members" ON organization_members;

-- 3. 새로운 정책 생성 (순환 참조 완전 제거)
-- SELECT 정책: user_id로 직접 확인하거나 users 테이블의 primary_organization_id 사용
CREATE POLICY "조직 멤버는 같은 조직의 멤버 정보 조회 가능"
  ON organization_members FOR SELECT
  USING (
    -- 자신의 레코드는 항상 조회 가능
    user_id = auth.uid()
    OR
    -- 자신의 primary_organization_id와 같은 조직의 멤버 조회 가능
    organization_id IN (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid() AND primary_organization_id IS NOT NULL
    )
  );

-- INSERT/UPDATE/DELETE 정책: 소유자만 가능 (단순화)
CREATE POLICY "조직 소유자는 멤버 관리 가능"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
  );

-- 4. organizations 테이블 RLS 재설정
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "조직 멤버는 자신의 조직 정보 조회 가능" ON organizations;
DROP POLICY IF EXISTS "조직 소유자는 자신의 조직 정보 수정 가능" ON organizations;

-- organizations SELECT 정책
CREATE POLICY "조직 멤버는 자신의 조직 정보 조회 가능"
  ON organizations FOR SELECT
  USING (
    -- 소유자이거나
    owner_id = auth.uid()
    OR
    -- primary_organization_id와 일치
    id IN (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid() AND primary_organization_id IS NOT NULL
    )
  );

-- organizations UPDATE 정책
CREATE POLICY "조직 소유자는 자신의 조직 정보 수정 가능"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 5. organization_invitations 테이블 RLS 재설정
ALTER TABLE organization_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "조직 관리자는 초대 정보 조회 및 관리 가능" ON organization_invitations;

CREATE POLICY "조직 소유자는 초대 정보 조회 및 관리 가능"
  ON organization_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'RLS 무한 재귀 완전 수정 완료 (v2)';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. RLS 비활성화 후 재활성화 (캐시 초기화)';
  RAISE NOTICE '2. 모든 기존 정책 삭제';
  RAISE NOTICE '3. 단순화된 정책 생성 (순환 참조 완전 제거)';
  RAISE NOTICE '4. organization_members: user_id 직접 확인 또는 users.primary_organization_id 사용';
  RAISE NOTICE '5. organizations: owner_id 또는 users.primary_organization_id 사용';
  RAISE NOTICE '6. organization_invitations: organizations.owner_id 사용';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ RLS 캐시 초기화 및 순환 참조 제거 완료';
  RAISE NOTICE '=================================================';
END $$;
