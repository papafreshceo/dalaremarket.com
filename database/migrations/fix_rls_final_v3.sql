-- =====================================================
-- RLS 완전 수정 - INSERT 정책 추가 (v3)
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: organizations 테이블에 INSERT 정책 추가
--       Service Role은 자동으로 모든 RLS 우회
-- =====================================================

-- 1. organizations 테이블 RLS 완전 재설정
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 2. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "조직 멤버는 자신의 조직 정보 조회 가능" ON organizations;
DROP POLICY IF EXISTS "조직 소유자는 자신의 조직 정보 수정 가능" ON organizations;
DROP POLICY IF EXISTS "조직 생성 허용" ON organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable read access for organization members" ON organizations;

-- 3. 새로운 정책 생성

-- INSERT 정책: 인증된 사용자는 자신의 조직 생성 가능
CREATE POLICY "조직 생성 허용"
  ON organizations FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
  );

-- SELECT 정책: 소유자 또는 멤버만 조회 가능
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

-- UPDATE 정책: 소유자만 수정 가능
CREATE POLICY "조직 소유자는 자신의 조직 정보 수정 가능"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE 정책: 소유자만 삭제 가능
CREATE POLICY "조직 소유자는 자신의 조직 삭제 가능"
  ON organizations FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- 4. organization_members 테이블 재확인
-- =====================================================

ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "조직 멤버는 같은 조직의 멤버 정보 조회 가능" ON organization_members;
DROP POLICY IF EXISTS "조직 소유자는 멤버 관리 가능" ON organization_members;

-- SELECT 정책: 자신 또는 같은 조직 멤버 조회
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

-- INSERT 정책: 조직 소유자만 멤버 추가 가능
CREATE POLICY "조직 소유자는 멤버 추가 가능"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
  );

-- UPDATE 정책: 조직 소유자만 멤버 수정 가능
CREATE POLICY "조직 소유자는 멤버 수정 가능"
  ON organization_members FOR UPDATE
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

-- DELETE 정책: 조직 소유자만 멤버 삭제 가능
CREATE POLICY "조직 소유자는 멤버 삭제 가능"
  ON organization_members FOR DELETE
  USING (
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
  RAISE NOTICE 'RLS 완전 수정 완료 (v3) - INSERT 정책 추가';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. organizations 테이블에 INSERT 정책 추가';
  RAISE NOTICE '2. organization_members 테이블 정책 분리 (INSERT/UPDATE/DELETE)';
  RAISE NOTICE '3. 모든 정책에서 순환 참조 제거';
  RAISE NOTICE '4. Service Role은 자동으로 모든 RLS 우회';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 조직 생성 RLS 정책 추가 완료';
  RAISE NOTICE '=================================================';
END $$;
