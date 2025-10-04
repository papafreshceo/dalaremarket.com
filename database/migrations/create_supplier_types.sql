-- 거래처 유형 테이블 생성
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- ============================================
-- 1. supplier_types 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_supplier_types_type_name ON supplier_types(type_name);
CREATE INDEX IF NOT EXISTS idx_supplier_types_is_active ON supplier_types(is_active);

-- ============================================
-- 3. RLS 정책
-- ============================================
ALTER TABLE supplier_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_supplier_types"
ON supplier_types
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- ============================================
-- 4. 트리거: updated_at 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_supplier_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_types_updated_at
BEFORE UPDATE ON supplier_types
FOR EACH ROW
EXECUTE FUNCTION update_supplier_types_updated_at();

-- ============================================
-- 5. 기본 데이터 삽입
-- ============================================
INSERT INTO supplier_types (type_name, description) VALUES
('농가', '개별 농가 및 농업 생산자'),
('도매상', '농수산물 도매업체'),
('직거래', '직거래 공급업체'),
('수입상', '수입 농수산물 공급업체'),
('기타', '기타 공급업체')
ON CONFLICT (type_name) DO NOTHING;

-- ============================================
-- 6. 완료 확인
-- ============================================
SELECT * FROM supplier_types ORDER BY type_name;
