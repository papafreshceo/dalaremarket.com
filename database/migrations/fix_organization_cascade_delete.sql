-- 조직 삭제 시 관련 데이터도 함께 삭제되도록 CASCADE 설정
-- 이렇게 하면 서브 조직 삭제 시 관련된 트랜잭션, 주문 등도 자동 삭제됨

-- 1. user_credit_transactions 외래키 제약조건 수정
ALTER TABLE user_credit_transactions
DROP CONSTRAINT IF EXISTS user_credit_transactions_organization_id_fkey;

ALTER TABLE user_credit_transactions
ADD CONSTRAINT user_credit_transactions_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 2. user_cash_transactions 외래키 제약조건 수정 (있다면)
ALTER TABLE user_cash_transactions
DROP CONSTRAINT IF EXISTS user_cash_transactions_organization_id_fkey;

ALTER TABLE user_cash_transactions
ADD CONSTRAINT user_cash_transactions_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 3. platform_seller_orders 외래키 제약조건 수정 (있다면)
ALTER TABLE platform_seller_orders
DROP CONSTRAINT IF EXISTS platform_seller_orders_organization_id_fkey;

ALTER TABLE platform_seller_orders
ADD CONSTRAINT platform_seller_orders_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 4. integrated_orders 외래키 제약조건 수정 (있다면)
ALTER TABLE integrated_orders
DROP CONSTRAINT IF EXISTS integrated_orders_organization_id_fkey;

ALTER TABLE integrated_orders
ADD CONSTRAINT integrated_orders_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 5. user_credits 외래키 제약조건 수정
ALTER TABLE user_credits
DROP CONSTRAINT IF EXISTS user_credits_organization_id_fkey;

ALTER TABLE user_credits
ADD CONSTRAINT user_credits_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 6. user_cash 외래키 제약조건 수정
ALTER TABLE user_cash
DROP CONSTRAINT IF EXISTS user_cash_organization_id_fkey;

ALTER TABLE user_cash
ADD CONSTRAINT user_cash_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 7. organization_members 외래키 제약조건 수정
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;

ALTER TABLE organization_members
ADD CONSTRAINT organization_members_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- 8. organization_invitations 외래키 제약조건 수정
ALTER TABLE organization_invitations
DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;

ALTER TABLE organization_invitations
ADD CONSTRAINT organization_invitations_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT user_credit_transactions_organization_id_fkey ON user_credit_transactions IS
'CASCADE 삭제: 조직 삭제 시 관련 크레딧 거래 내역도 삭제';

COMMENT ON CONSTRAINT user_cash_transactions_organization_id_fkey ON user_cash_transactions IS
'CASCADE 삭제: 조직 삭제 시 관련 캐시 거래 내역도 삭제';

COMMENT ON CONSTRAINT user_credits_organization_id_fkey ON user_credits IS
'CASCADE 삭제: 조직 삭제 시 관련 크레딧 잔액도 삭제';

COMMENT ON CONSTRAINT user_cash_organization_id_fkey ON user_cash IS
'CASCADE 삭제: 조직 삭제 시 관련 캐시 잔액도 삭제';

COMMENT ON CONSTRAINT organization_members_organization_id_fkey ON organization_members IS
'CASCADE 삭제: 조직 삭제 시 관련 멤버 정보도 삭제';

COMMENT ON CONSTRAINT organization_invitations_organization_id_fkey ON organization_invitations IS
'CASCADE 삭제: 조직 삭제 시 관련 초대 정보도 삭제';
