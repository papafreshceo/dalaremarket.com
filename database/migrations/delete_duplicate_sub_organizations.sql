-- 서브 조직 삭제를 위한 CASCADE 설정 및 삭제 SQL
-- 중복 생성된 서브 조직들을 정리하고, 향후 조직 삭제 시 관련 데이터도 자동 삭제되도록 설정

-- 1. user_credit_transactions CASCADE 설정
ALTER TABLE user_credit_transactions
DROP CONSTRAINT IF EXISTS user_credit_transactions_organization_id_fkey;

ALTER TABLE user_credit_transactions
ADD CONSTRAINT user_credit_transactions_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 2. user_cash_transactions CASCADE 설정
ALTER TABLE user_cash_transactions
DROP CONSTRAINT IF EXISTS user_cash_transactions_organization_id_fkey;

ALTER TABLE user_cash_transactions
ADD CONSTRAINT user_cash_transactions_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 3. user_credits CASCADE 설정
ALTER TABLE user_credits
DROP CONSTRAINT IF EXISTS user_credits_organization_id_fkey;

ALTER TABLE user_credits
ADD CONSTRAINT user_credits_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 4. user_cash CASCADE 설정
ALTER TABLE user_cash
DROP CONSTRAINT IF EXISTS user_cash_organization_id_fkey;

ALTER TABLE user_cash
ADD CONSTRAINT user_cash_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 5. integrated_orders CASCADE 설정
ALTER TABLE integrated_orders
DROP CONSTRAINT IF EXISTS integrated_orders_organization_id_fkey;

ALTER TABLE integrated_orders
ADD CONSTRAINT integrated_orders_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 6. organization_members CASCADE 설정
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;

ALTER TABLE organization_members
ADD CONSTRAINT organization_members_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 7. organization_invitations CASCADE 설정
ALTER TABLE organization_invitations
DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;

ALTER TABLE organization_invitations
ADD CONSTRAINT organization_invitations_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 8. 모든 서브 조직 삭제 (CASCADE로 인해 관련 데이터도 자동 삭제됨)
DELETE FROM organizations WHERE is_main = false;

-- 9. 결과 확인
SELECT
  owner_id,
  COUNT(*) as total_orgs,
  COUNT(*) FILTER (WHERE is_main = true) as main_count,
  COUNT(*) FILTER (WHERE is_main = false) as sub_count
FROM organizations
GROUP BY owner_id
ORDER BY total_orgs DESC;
