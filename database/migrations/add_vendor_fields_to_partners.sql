-- ============================================
-- 거래처(partners) 테이블에 벤더사 관련 필드 추가
-- ============================================

-- 벤더사 발송지 정보 테이블 생성
CREATE TABLE IF NOT EXISTS vendor_shipping_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  address TEXT,
  contact TEXT,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(partner_id, location_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vendor_locations_partner ON vendor_shipping_locations(partner_id);

-- updated_at 트리거
DROP TRIGGER IF EXISTS update_vendor_shipping_locations_updated_at ON vendor_shipping_locations;
CREATE TRIGGER update_vendor_shipping_locations_updated_at
  BEFORE UPDATE ON vendor_shipping_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE vendor_shipping_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON vendor_shipping_locations;
CREATE POLICY "Allow all for authenticated users"
  ON vendor_shipping_locations FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 완료
SELECT '✅ 벤더사 발송지 정보 테이블 생성 완료!' as result;
