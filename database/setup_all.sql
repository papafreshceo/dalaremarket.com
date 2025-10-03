-- ============================================
-- 전체 DB 설정 통합 스크립트
-- ============================================
-- 실행 순서대로 모든 설정을 포함
-- ============================================

-- 1. raw_materials 테이블 정리
-- ============================================

-- 카테고리 TEXT 컬럼 추가 (5단계)
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS category_1 TEXT;  -- 대분류
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS category_2 TEXT;  -- 중분류
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS category_3 TEXT;  -- 소분류
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS category_4 TEXT;  -- 품목
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS category_5 TEXT;  -- 품종

-- 기존 FK 컬럼 삭제
ALTER TABLE raw_materials DROP COLUMN IF EXISTS category_level_1_id CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS category_level_2_id CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS category_level_3_id CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS category_level_4_id CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS category_level_5_id CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS category_level_6_id CASCADE;

-- 불필요한 컬럼 삭제
ALTER TABLE raw_materials DROP COLUMN IF EXISTS min_order_quantity CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS max_order_quantity CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS storage_condition CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS shelf_life_days CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS origin CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS grade_standard CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS quality_standard CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS certification CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS unit_weight CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS lead_time_days CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS image_urls CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS item_type CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS variety CASCADE;
ALTER TABLE raw_materials DROP COLUMN IF EXISTS category_6 CASCADE;

-- supply_status, season ENUM을 TEXT로 변경
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supply_status') THEN
    ALTER TABLE raw_materials
      ALTER COLUMN supply_status TYPE TEXT
      USING supply_status::TEXT;
    DROP TYPE IF EXISTS supply_status CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'season_type') THEN
    ALTER TABLE raw_materials
      ALTER COLUMN season TYPE TEXT
      USING season::TEXT;
    DROP TYPE IF EXISTS season_type CASCADE;
  END IF;
END $$;

-- material_categories 테이블 삭제
DROP TABLE IF EXISTS material_categories CASCADE;

-- 2. supply_status_settings 테이블 설정
-- ============================================

-- 기존 테이블 삭제
DROP TABLE IF EXISTS supply_status_settings CASCADE;

-- 새 구조로 테이블 생성
CREATE TABLE supply_status_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_type TEXT NOT NULL CHECK (status_type IN ('raw_material', 'optional_product')),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(status_type, code)
);

-- 기본 데이터 삽입
-- 원물 공급상태 (2개)
INSERT INTO supply_status_settings (status_type, code, name, color, display_order, is_active)
VALUES
  ('raw_material', 'SHIPPING', '출하중', '#10B981', 1, true),
  ('raw_material', 'SEASON_END', '시즌종료', '#F59E0B', 2, true);

-- 옵션상품 공급상태 (5개)
INSERT INTO supply_status_settings (status_type, code, name, color, display_order, is_active)
VALUES
  ('optional_product', 'PREPARING', '준비중', '#3B82F6', 1, true),
  ('optional_product', 'SUPPLYING', '공급중', '#10B981', 2, true),
  ('optional_product', 'PAUSED', '일시중지', '#F59E0B', 3, true),
  ('optional_product', 'STOPPED', '공급중지', '#EF4444', 4, true),
  ('optional_product', 'SEASON_END', '시즌종료', '#9CA3AF', 5, true);

-- 트리거 생성
CREATE TRIGGER update_supply_status_settings_updated_at
  BEFORE UPDATE ON supply_status_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE supply_status_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 추가
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON supply_status_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON supply_status_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON supply_status_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON supply_status_settings;

-- 모든 사용자 읽기 허용
CREATE POLICY "Enable read access for all users"
ON supply_status_settings FOR SELECT
TO authenticated
USING (true);

-- 인증된 사용자 삽입 허용
CREATE POLICY "Enable insert for authenticated users"
ON supply_status_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- 인증된 사용자 수정 허용
CREATE POLICY "Enable update for authenticated users"
ON supply_status_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 인증된 사용자 삭제 허용
CREATE POLICY "Enable delete for authenticated users"
ON supply_status_settings FOR DELETE
TO authenticated
USING (true);

-- 완료
SELECT '✅ 전체 DB 설정 완료!' as result;
SELECT '1. raw_materials 테이블 정리 완료 (카테고리 5단계)' as step_1;
SELECT '2. supply_status_settings 테이블 생성 및 데이터 삽입 완료' as step_2;
SELECT '3. RLS 정책 추가 완료' as step_3;
