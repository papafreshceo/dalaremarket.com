-- 옵션명 매칭 테이블 생성
CREATE TABLE IF NOT EXISTS option_name_mappings (
  id BIGSERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_option_name TEXT NOT NULL, -- 판매자가 사용하는 옵션명
  site_option_name TEXT NOT NULL, -- 사이트 표준 옵션명 (option_products.option_name과 매칭)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(seller_id, user_option_name) -- 같은 판매자의 같은 사용자 옵션명은 하나만 존재
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_option_name_mappings_seller_id ON option_name_mappings(seller_id);
CREATE INDEX IF NOT EXISTS idx_option_name_mappings_user_option_name ON option_name_mappings(user_option_name);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_option_name_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_option_name_mappings_updated_at ON option_name_mappings;

CREATE TRIGGER trigger_option_name_mappings_updated_at
  BEFORE UPDATE ON option_name_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_option_name_mappings_updated_at();

-- RLS 정책 설정
ALTER TABLE option_name_mappings ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Users can view their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can create their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can update their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can delete their own option name mappings" ON option_name_mappings;

-- 자신의 매핑만 조회 가능
CREATE POLICY "Users can view their own option name mappings"
  ON option_name_mappings
  FOR SELECT
  USING (auth.uid() = seller_id);

-- 자신의 매핑만 생성 가능
CREATE POLICY "Users can create their own option name mappings"
  ON option_name_mappings
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- 자신의 매핑만 수정 가능
CREATE POLICY "Users can update their own option name mappings"
  ON option_name_mappings
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- 자신의 매핑만 삭제 가능
CREATE POLICY "Users can delete their own option name mappings"
  ON option_name_mappings
  FOR DELETE
  USING (auth.uid() = seller_id);
