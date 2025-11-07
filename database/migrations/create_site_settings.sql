-- site_settings 테이블 생성
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT '달래마켓',
  site_logo_url TEXT,
  site_description TEXT,
  site_keywords TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  business_hours TEXT,
  footer_text TEXT,
  company_name TEXT,
  ceo_name TEXT,
  business_number TEXT,
  e_commerce_license_number TEXT,
  address TEXT,
  privacy_officer_name TEXT,
  privacy_officer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- 기본 데이터 삽입 (단일 레코드만 유지)
INSERT INTO site_settings (
  site_name,
  site_logo_url,
  site_description,
  site_keywords,
  contact_email,
  contact_phone,
  business_hours,
  footer_text,
  company_name,
  ceo_name,
  business_number,
  e_commerce_license_number,
  address,
  privacy_officer_name,
  privacy_officer_email
) VALUES (
  '달래마켓',
  'https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png',
  '신선한 농산물을 직접 공급하는 B2B 플랫폼',
  '농산물, B2B, 도매, 납품, 신선식품',
  'contact@dalreamarket.com',
  '1588-0000',
  '평일 09:00 - 18:00',
  '© 2025 달래마켓. All rights reserved.',
  '(주)달래마켓',
  '홍길동',
  '123-45-67890',
  '2024-서울강남-12345',
  '서울특별시 강남구 테헤란로 123',
  '김개인',
  'privacy@dalreamarket.com'
)
ON CONFLICT DO NOTHING;

-- 단일 레코드 제약 조건 추가 (선택사항)
-- 사이트 설정은 하나만 존재해야 함
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_singleton ON site_settings ((true));
