-- ============================================
-- 출고처/송장주체 설정 테이블 생성
-- ============================================

-- 출고처 설정 테이블
CREATE TABLE IF NOT EXISTS shipping_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- 송장주체 설정 테이블
CREATE TABLE IF NOT EXISTS invoice_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_shipping_vendors_active ON shipping_vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_invoice_entities_active ON invoice_entities(is_active);

-- updated_at 트리거
DROP TRIGGER IF EXISTS update_shipping_vendors_updated_at ON shipping_vendors;
CREATE TRIGGER update_shipping_vendors_updated_at
  BEFORE UPDATE ON shipping_vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_entities_updated_at ON invoice_entities;
CREATE TRIGGER update_invoice_entities_updated_at
  BEFORE UPDATE ON invoice_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE shipping_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON shipping_vendors;
CREATE POLICY "Allow all for authenticated users" ON shipping_vendors
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoice_entities;
CREATE POLICY "Allow all for authenticated users" ON invoice_entities
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 기본 데이터 추가
INSERT INTO shipping_vendors (name, display_order) VALUES
  ('자사', 1),
  ('위탁', 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO invoice_entities (name, display_order) VALUES
  ('자사', 1),
  ('위탁', 2)
ON CONFLICT (name) DO NOTHING;

-- 완료
SELECT '✅ 출고처/송장주체 설정 테이블 생성 완료!' as result;
