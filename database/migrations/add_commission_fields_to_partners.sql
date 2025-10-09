-- partners 테이블에 필요한 모든 컬럼 추가

ALTER TABLE partners ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS business_number TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS representative TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS representative_phone TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS account_holder TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS commission_type TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 기본값 설정
UPDATE partners SET commission_type = '정액' WHERE commission_type IS NULL;
UPDATE partners SET commission_rate = 0 WHERE commission_rate IS NULL;
UPDATE partners SET is_active = true WHERE is_active IS NULL;
