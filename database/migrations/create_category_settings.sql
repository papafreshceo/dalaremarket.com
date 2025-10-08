-- 카테고리 설정 테이블 생성
-- 실행 날짜: 2025-10-08

-- category_settings 테이블 생성
CREATE TABLE IF NOT EXISTS category_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_1 TEXT, -- 대분류
  category_2 TEXT, -- 중분류
  category_3 TEXT, -- 소분류
  category_4 TEXT, -- 품목
  category_5 TEXT, -- 품종
  notes TEXT, -- 비고
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_category_settings_category_1 ON category_settings(category_1);
CREATE INDEX IF NOT EXISTS idx_category_settings_category_2 ON category_settings(category_2);
CREATE INDEX IF NOT EXISTS idx_category_settings_category_3 ON category_settings(category_3);
CREATE INDEX IF NOT EXISTS idx_category_settings_category_4 ON category_settings(category_4);
CREATE INDEX IF NOT EXISTS idx_category_settings_category_5 ON category_settings(category_5);
CREATE INDEX IF NOT EXISTS idx_category_settings_is_active ON category_settings(is_active);

-- RLS 정책 활성화
ALTER TABLE category_settings ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Enable read access for authenticated users" ON category_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- 모든 인증된 사용자가 삽입 가능
CREATE POLICY "Enable insert for authenticated users" ON category_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 모든 인증된 사용자가 수정 가능
CREATE POLICY "Enable update for authenticated users" ON category_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 모든 인증된 사용자가 삭제 가능
CREATE POLICY "Enable delete for authenticated users" ON category_settings
  FOR DELETE
  TO authenticated
  USING (true);

-- 코멘트 추가
COMMENT ON TABLE category_settings IS '카테고리 조견표 관리';
COMMENT ON COLUMN category_settings.category_1 IS '대분류';
COMMENT ON COLUMN category_settings.category_2 IS '중분류';
COMMENT ON COLUMN category_settings.category_3 IS '소분류';
COMMENT ON COLUMN category_settings.category_4 IS '품목';
COMMENT ON COLUMN category_settings.category_5 IS '품종';
COMMENT ON COLUMN category_settings.notes IS '비고';
