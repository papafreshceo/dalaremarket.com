-- partner_types 테이블 생성
CREATE TABLE IF NOT EXISTS partner_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE partner_types ENABLE ROW LEVEL SECURITY;

-- 정책 생성
CREATE POLICY "Enable read access for all users" ON partner_types
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON partner_types
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON partner_types
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON partner_types
  FOR DELETE USING (true);

-- 기본 거래처 유형 데이터 입력
INSERT INTO partner_types (type_name, description) VALUES
  ('농가', '농산물 생산 농가'),
  ('중매인', '농산물 중개 업체'),
  ('도매상', '농산물 도매 업체'),
  ('소매상', '농산물 소매 업체')
ON CONFLICT (type_name) DO NOTHING;
