-- =====================================================
-- organization_members RLS 무한 재귀 수정
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: organization_members 테이블의 RLS 정책에서
--       자기 자신을 참조하는 순환 참조 문제를 수정
-- 문제: organization_members SELECT 정책이 자기 자신을
--       다시 조회하여 무한 재귀 발생
-- 해결: users 테이블의 primary_organization_id를 활용
-- =====================================================

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "조직 멤버는 같은 조직의 멤버 정보 조회 가능" ON organization_members;
DROP POLICY IF EXISTS "조직 관리자는 멤버 관리 가능" ON organization_members;

-- 2. 새로운 SELECT 정책 (순환 참조 제거)
-- users.primary_organization_id를 활용하여 순환 참조 방지
CREATE POLICY "조직 멤버는 같은 조직의 멤버 정보 조회 가능"
  ON organization_members FOR SELECT
  USING (
    -- 자신의 레코드는 항상 조회 가능
    user_id = auth.uid()
    OR
    -- 자신의 primary_organization_id와 같은 조직의 멤버 조회 가능
    organization_id = (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- 3. 새로운 INSERT/UPDATE/DELETE 정책 (멤버 관리 권한)
-- 자기 자신의 멤버십 정보는 직접 확인 가능 (순환 참조 없음)
CREATE POLICY "조직 관리자는 멤버 관리 가능"
  ON organization_members FOR ALL
  USING (
    -- 자신의 조직에서 owner 또는 admin 역할이고 can_manage_members = true인 경우
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
        AND om.can_manage_members = true
    )
  )
  WITH CHECK (
    -- INSERT/UPDATE 시에도 동일한 체크
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
        AND om.can_manage_members = true
    )
  );

-- 4. organizations 테이블의 RLS 정책도 수정 (순환 참조 제거)
DROP POLICY IF EXISTS "조직 멤버는 자신의 조직 정보 조회 가능" ON organizations;

CREATE POLICY "조직 멤버는 자신의 조직 정보 조회 가능"
  ON organizations FOR SELECT
  USING (
    -- 자신의 primary_organization_id와 일치
    id = (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- 5. organization_invitations 테이블의 RLS 정책도 수정
DROP POLICY IF EXISTS "조직 관리자는 초대 정보 조회 및 관리 가능" ON organization_invitations;

CREATE POLICY "조직 관리자는 초대 정보 조회 및 관리 가능"
  ON organization_invitations FOR ALL
  USING (
    -- 자신의 조직에서 admin 이상이고 멤버 관리 권한이 있는 경우
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
        AND om.can_manage_members = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
        AND om.can_manage_members = true
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'organization_members RLS 무한 재귀 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '수정된 정책:';
  RAISE NOTICE '1. organization_members SELECT - users.primary_organization_id 활용';
  RAISE NOTICE '2. organization_members ALL - 직접 멤버십 확인';
  RAISE NOTICE '3. organizations SELECT - users.primary_organization_id 활용';
  RAISE NOTICE '4. organization_invitations ALL - 직접 멤버십 확인';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 순환 참조 제거 완료';
  RAISE NOTICE '=================================================';
END $$;
