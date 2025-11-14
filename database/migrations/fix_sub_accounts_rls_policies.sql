-- =====================================================
-- sub_accounts RLS 정책 수정
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: organization_members 테이블 기반으로 RLS 정책 재작성
--       (기존 owner_id 방식에서 멤버십 기반으로 변경)
-- =====================================================

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view their organization's sub accounts" ON sub_accounts;
DROP POLICY IF EXISTS "Users can insert sub accounts for their organization" ON sub_accounts;
DROP POLICY IF EXISTS "Users can update their organization's sub accounts" ON sub_accounts;
DROP POLICY IF EXISTS "Users can delete their organization's sub accounts" ON sub_accounts;

-- 2. 멤버십 기반 RLS 정책 생성

-- 조회: 본인이 멤버인 조직의 서브 계정만 조회 가능
CREATE POLICY "Members can view their organization's sub accounts"
  ON sub_accounts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- 삽입: 본인이 owner 또는 can_manage_orders 권한이 있는 조직에만 서브 계정 생성 가능
CREATE POLICY "Members with permissions can insert sub accounts"
  ON sub_accounts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND (role = 'owner' OR can_manage_orders = true)
    )
  );

-- 수정: 본인이 owner 또는 can_manage_orders 권한이 있는 조직의 서브 계정만 수정 가능
CREATE POLICY "Members with permissions can update sub accounts"
  ON sub_accounts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND (role = 'owner' OR can_manage_orders = true)
    )
  );

-- 삭제: 본인이 owner인 조직의 서브 계정만 삭제 가능
CREATE POLICY "Organization owners can delete sub accounts"
  ON sub_accounts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND role = 'owner'
    )
  );

-- 3. 관리자 정책 추가
-- 관리자(admin, super_admin, employee)는 모든 서브 계정 조회/수정 가능
CREATE POLICY "Admins can manage all sub accounts"
  ON sub_accounts FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'super_admin', 'employee')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'super_admin', 'employee')
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ sub_accounts RLS 정책 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- owner_id 기반 → organization_members 기반으로 변경';
  RAISE NOTICE '- 조회: 조직 멤버 모두 가능';
  RAISE NOTICE '- 생성/수정: owner 또는 can_manage_orders 권한 필요';
  RAISE NOTICE '- 삭제: owner만 가능';
  RAISE NOTICE '- 관리자는 모든 작업 가능';
  RAISE NOTICE '=================================================';
END $$;
