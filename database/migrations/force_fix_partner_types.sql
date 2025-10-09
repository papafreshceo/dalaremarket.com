-- Force fix partner_types table by removing ALL constraints and adding columns

-- 1. Drop ALL check constraints on partner_types table
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'partner_types'::regclass
        AND contype = 'c'  -- check constraint
    LOOP
        EXECUTE 'ALTER TABLE partner_types DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END LOOP;
END $$;

-- 2. Add partner_category column if not exists
ALTER TABLE partner_types
ADD COLUMN IF NOT EXISTS partner_category TEXT;

-- 3. Add code_prefix column if not exists
ALTER TABLE partner_types
ADD COLUMN IF NOT EXISTS code_prefix TEXT;

-- 4. Make sure columns are nullable (remove NOT NULL if exists)
ALTER TABLE partner_types
ALTER COLUMN partner_category DROP NOT NULL;

ALTER TABLE partner_types
ALTER COLUMN code_prefix DROP NOT NULL;

-- 5. Update existing NULL rows with default values
UPDATE partner_types
SET partner_category = '공급자'
WHERE partner_category IS NULL;

UPDATE partner_types
SET code_prefix = 'SUP'
WHERE code_prefix IS NULL;

-- 6. Comments
COMMENT ON COLUMN partner_types.partner_category IS '거래처 구분 (사용자 정의 가능)';
COMMENT ON COLUMN partner_types.code_prefix IS '거래처 코드 이니셜 (예: SUP, CUS, VEN)';
