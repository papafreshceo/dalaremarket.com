-- Add depositor_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS depositor_name TEXT;

COMMENT ON COLUMN users.depositor_name IS '입금자명 (예금주와 다를 경우 입력)';
