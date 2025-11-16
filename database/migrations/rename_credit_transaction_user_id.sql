-- Rename used_by_user_id to transaction_by in transaction tables
-- (organization_credits/cash already don't have user_id column)

-- Rename used_by_user_id to transaction_by in credit transactions
ALTER TABLE organization_credit_transactions
RENAME COLUMN used_by_user_id TO transaction_by;

COMMENT ON COLUMN organization_credit_transactions.transaction_by IS '거래를 수행한 사용자 ID (users.id)';

-- Rename used_by_user_id to transaction_by in cash transactions
ALTER TABLE organization_cash_transactions
RENAME COLUMN used_by_user_id TO transaction_by;

COMMENT ON COLUMN organization_cash_transactions.transaction_by IS '거래를 수행한 사용자 ID (users.id)';
