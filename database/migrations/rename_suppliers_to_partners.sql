-- suppliers 테이블을 partners로 변경
-- supplier_types 테이블을 partner_types로 변경
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- ============================================
-- 1. supplier_types를 partner_types로 이름 변경
-- ============================================
ALTER TABLE IF EXISTS supplier_types RENAME TO partner_types;

-- 인덱스 이름 변경
ALTER INDEX IF EXISTS idx_supplier_types_type_name RENAME TO idx_partner_types_type_name;
ALTER INDEX IF EXISTS idx_supplier_types_is_active RENAME TO idx_partner_types_is_active;

-- 트리거 함수 이름 변경
ALTER FUNCTION IF EXISTS update_supplier_types_updated_at() RENAME TO update_partner_types_updated_at;

-- 트리거 이름 변경
ALTER TRIGGER IF EXISTS trigger_update_supplier_types_updated_at ON partner_types RENAME TO trigger_update_partner_types_updated_at;

-- RLS 정책 삭제 후 재생성
DROP POLICY IF EXISTS "admin_all_supplier_types" ON partner_types;

CREATE POLICY "admin_all_partner_types"
ON partner_types
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- ============================================
-- 2. suppliers를 partners로 이름 변경
-- ============================================
ALTER TABLE IF EXISTS suppliers RENAME TO partners;

-- 컬럼 이름 변경
ALTER TABLE partners RENAME COLUMN supplier_type TO partner_type;

-- 인덱스 이름 변경 (존재하는 경우)
ALTER INDEX IF EXISTS idx_suppliers_code RENAME TO idx_partners_code;
ALTER INDEX IF EXISTS idx_suppliers_name RENAME TO idx_partners_name;
ALTER INDEX IF EXISTS idx_suppliers_supplier_type RENAME TO idx_partners_partner_type;

-- 트리거 함수 이름 변경 (존재하는 경우)
ALTER FUNCTION IF EXISTS update_suppliers_updated_at() RENAME TO update_partners_updated_at;

-- 트리거 이름 변경 (존재하는 경우)
ALTER TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON partners RENAME TO trigger_update_partners_updated_at;

-- RLS 정책 삭제 후 재생성
DROP POLICY IF EXISTS "admin_all_suppliers" ON partners;

CREATE POLICY "admin_all_partners"
ON partners
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- ============================================
-- 3. 파트너 분류 컬럼 추가
-- ============================================
-- 파트너 분류: '공급자' (내가 물건을 사는 사람) 또는 '고객' (내가 물건을 파는 사람)
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS partner_category VARCHAR(20) DEFAULT '공급자' CHECK (partner_category IN ('공급자', '고객'));

COMMENT ON COLUMN partners.partner_category IS '공급자: 내가 물건을 사는 사람, 고객: 내가 물건을 파는 사람';

-- ============================================
-- 4. 완료 확인
-- ============================================
SELECT 'partner_types 테이블' as table_name, COUNT(*) as count FROM partner_types
UNION ALL
SELECT 'partners 테이블' as table_name, COUNT(*) as count FROM partners;
