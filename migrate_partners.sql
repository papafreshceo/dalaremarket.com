-- suppliers 테이블을 partners로 이름 변경
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        ALTER TABLE suppliers RENAME TO partners;
    END IF;
END $$;

-- suppliers_types 테이블을 partner_types로 이름 변경
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers_types') THEN
        ALTER TABLE suppliers_types RENAME TO partner_types;
    END IF;
END $$;

-- 컬럼명 변경 (supplier -> partner)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'supplier_type'
    ) THEN
        ALTER TABLE partners RENAME COLUMN supplier_type TO partner_type;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'supplier_category'
    ) THEN
        ALTER TABLE partners RENAME COLUMN supplier_category TO partner_category;
    END IF;
END $$;

-- 대표자 전화번호 추가
ALTER TABLE partners ADD COLUMN IF NOT EXISTS representative_phone TEXT;

-- 계좌정보 추가
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS account_holder TEXT;

-- 거래처 코드가 없는 기존 레코드에 코드 자동 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'partner_category') THEN
        UPDATE partners
        SET code = CASE
          WHEN partner_category = '공급자' THEN 'SUP' || LPAD((ROW_NUMBER() OVER (PARTITION BY partner_category ORDER BY created_at))::TEXT, 4, '0')
          ELSE 'CUS' || LPAD((ROW_NUMBER() OVER (PARTITION BY partner_category ORDER BY created_at))::TEXT, 4, '0')
        END
        WHERE code IS NULL OR code = '';
    END IF;
END $$;

-- 코드 컬럼을 NOT NULL로 변경
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM partners WHERE code IS NULL OR code = '') THEN
        ALTER TABLE partners ALTER COLUMN code SET NOT NULL;
    END IF;
END $$;

-- 코드 유니크 제약 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'partners_code_unique'
    ) THEN
        ALTER TABLE partners ADD CONSTRAINT partners_code_unique UNIQUE (code);
    END IF;
END $$;
