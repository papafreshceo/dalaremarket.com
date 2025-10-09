-- Fix partner_types table by removing check constraint and adding columns

-- 1. Drop the check constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_table_usage
    WHERE table_name = 'partner_types'
    AND constraint_name = 'partner_category_check'
  ) THEN
    ALTER TABLE partner_types DROP CONSTRAINT partner_category_check;
  END IF;
END $$;

-- 2. Add partner_category column if not exists
ALTER TABLE partner_types
ADD COLUMN IF NOT EXISTS partner_category TEXT;

-- 3. Add code_prefix column if not exists
ALTER TABLE partner_types
ADD COLUMN IF NOT EXISTS code_prefix TEXT;

-- 4. Update existing rows with default values (only NULL ones)
UPDATE partner_types
SET partner_category = '공급자'
WHERE partner_category IS NULL;

UPDATE partner_types
SET code_prefix = 'SUP'
WHERE code_prefix IS NULL;

-- 5. Comments
COMMENT ON COLUMN partner_types.partner_category IS '거래처 구분 (사용자 정의 가능)';
COMMENT ON COLUMN partner_types.code_prefix IS '거래처 코드 이니셜 (예: SUP, CUS, VEN)';
