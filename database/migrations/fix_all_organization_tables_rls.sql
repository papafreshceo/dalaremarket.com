-- =====================================================
-- 모든 조직 관련 테이블 RLS 정책 통일
-- =====================================================
-- 작성일: 2025-01-14
-- 설명:
--   - 관리자(super_admin, admin, employee): 모든 조직 데이터 조회/수정 가능
--   - 조직 멤버: 자신이 속한 조직 데이터만 조회/수정 가능
--   - 조직 소유자: 자신의 조직 데이터 조회/수정 가능
-- =====================================================

-- =====================================================
-- 1. organizations 테이블
-- =====================================================
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- SELECT: 관리자 또는 조직 멤버/소유자
CREATE POLICY "organizations_select_policy"
ON organizations FOR SELECT
USING (
  -- 관리자
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  -- 조직 멤버
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  -- 조직 소유자
  organizations.owner_id = auth.uid()
);

-- INSERT: 관리자 또는 본인이 소유자인 경우
CREATE POLICY "organizations_insert_policy"
ON organizations FOR INSERT
WITH CHECK (
  -- 관리자
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  -- 본인이 소유자
  organizations.owner_id = auth.uid()
);

-- UPDATE: 관리자 또는 조직 소유자
CREATE POLICY "organizations_update_policy"
ON organizations FOR UPDATE
USING (
  -- 관리자
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  -- 조직 소유자
  organizations.owner_id = auth.uid()
);

-- DELETE: 관리자만
CREATE POLICY "organizations_delete_policy"
ON organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

-- =====================================================
-- 2. organization_members 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_members_select_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_insert_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_update_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_delete_policy" ON organization_members;

CREATE POLICY "organization_members_select_policy"
ON organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_members.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_members_insert_policy"
ON organization_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_members.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_members_update_policy"
ON organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_members.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_members_delete_policy"
ON organization_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_members.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

-- =====================================================
-- 3. organization_invitations 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_invitations_select_policy" ON organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_insert_policy" ON organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_update_policy" ON organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_delete_policy" ON organization_invitations;

CREATE POLICY "organization_invitations_select_policy"
ON organization_invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_invitations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_invitations.organization_id
    AND organizations.owner_id = auth.uid()
  )
  OR
  -- 초대받은 본인
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = organization_invitations.email
  )
);

CREATE POLICY "organization_invitations_insert_policy"
ON organization_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_invitations.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_invitations_update_policy"
ON organization_invitations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_invitations.organization_id
    AND organizations.owner_id = auth.uid()
  )
  OR
  -- 초대받은 본인 (수락/거절 용도)
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = organization_invitations.email
  )
);

CREATE POLICY "organization_invitations_delete_policy"
ON organization_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_invitations.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

-- =====================================================
-- 4. organization_cash 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_cash_select_policy" ON organization_cash;
DROP POLICY IF EXISTS "organization_cash_insert_policy" ON organization_cash;
DROP POLICY IF EXISTS "organization_cash_update_policy" ON organization_cash;
DROP POLICY IF EXISTS "organization_cash_delete_policy" ON organization_cash;

CREATE POLICY "organization_cash_select_policy"
ON organization_cash FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_cash.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_cash.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_cash_insert_policy"
ON organization_cash FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

CREATE POLICY "organization_cash_update_policy"
ON organization_cash FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

CREATE POLICY "organization_cash_delete_policy"
ON organization_cash FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

-- =====================================================
-- 5. organization_credits 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_credits_select_policy" ON organization_credits;
DROP POLICY IF EXISTS "organization_credits_insert_policy" ON organization_credits;
DROP POLICY IF EXISTS "organization_credits_update_policy" ON organization_credits;
DROP POLICY IF EXISTS "organization_credits_delete_policy" ON organization_credits;

CREATE POLICY "organization_credits_select_policy"
ON organization_credits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_credits.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_credits.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_credits_insert_policy"
ON organization_credits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

CREATE POLICY "organization_credits_update_policy"
ON organization_credits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

CREATE POLICY "organization_credits_delete_policy"
ON organization_credits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

-- =====================================================
-- 6. organization_cash_history 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_cash_history_select_policy" ON organization_cash_history;
DROP POLICY IF EXISTS "organization_cash_history_insert_policy" ON organization_cash_history;

CREATE POLICY "organization_cash_history_select_policy"
ON organization_cash_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_cash_history.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_cash_history.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_cash_history_insert_policy"
ON organization_cash_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

-- =====================================================
-- 7. organization_credits_history 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_credits_history_select_policy" ON organization_credits_history;
DROP POLICY IF EXISTS "organization_credits_history_insert_policy" ON organization_credits_history;

CREATE POLICY "organization_credits_history_select_policy"
ON organization_credits_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_credits_history.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_credits_history.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_credits_history_insert_policy"
ON organization_credits_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
);

-- =====================================================
-- 8. organization_cash_transactions 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_cash_transactions_select_policy" ON organization_cash_transactions;
DROP POLICY IF EXISTS "organization_cash_transactions_insert_policy" ON organization_cash_transactions;

CREATE POLICY "organization_cash_transactions_select_policy"
ON organization_cash_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_cash_transactions.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_cash_transactions.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_cash_transactions_insert_policy"
ON organization_cash_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_cash_transactions.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
);

-- =====================================================
-- 9. organization_credit_transactions 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_credit_transactions_select_policy" ON organization_credit_transactions;
DROP POLICY IF EXISTS "organization_credit_transactions_insert_policy" ON organization_credit_transactions;

CREATE POLICY "organization_credit_transactions_select_policy"
ON organization_credit_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_credit_transactions.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_credit_transactions.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_credit_transactions_insert_policy"
ON organization_credit_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_credit_transactions.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
);

-- =====================================================
-- 10. organization_daily_rewards 테이블
-- =====================================================
DROP POLICY IF EXISTS "organization_daily_rewards_select_policy" ON organization_daily_rewards;
DROP POLICY IF EXISTS "organization_daily_rewards_insert_policy" ON organization_daily_rewards;

CREATE POLICY "organization_daily_rewards_select_policy"
ON organization_daily_rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_daily_rewards.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_daily_rewards.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "organization_daily_rewards_insert_policy"
ON organization_daily_rewards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'employee')
  )
  OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_daily_rewards.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 모든 조직 관련 테이블 RLS 정책 통일 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '적용된 테이블:';
  RAISE NOTICE '1. organizations';
  RAISE NOTICE '2. organization_members';
  RAISE NOTICE '3. organization_invitations';
  RAISE NOTICE '4. organization_cash';
  RAISE NOTICE '5. organization_credits';
  RAISE NOTICE '6. organization_cash_history';
  RAISE NOTICE '7. organization_credits_history';
  RAISE NOTICE '8. organization_cash_transactions';
  RAISE NOTICE '9. organization_credit_transactions';
  RAISE NOTICE '10. organization_daily_rewards';
  RAISE NOTICE '';
  RAISE NOTICE '정책 규칙:';
  RAISE NOTICE '- 관리자: 모든 조직 데이터 조회/수정 가능';
  RAISE NOTICE '- 조직 멤버: 자신이 속한 조직만 조회 가능';
  RAISE NOTICE '- 조직 소유자: 자신의 조직 조회/수정 가능';
  RAISE NOTICE '=================================================';
END $$;
