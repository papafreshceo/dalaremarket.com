-- raw_materials 테이블 카테고리 필드 정리
-- 실행 날짜: 2025-10-08
-- 목적: category_settings와 동일한 구조로 정리, 불필요한 필드 제거

-- 1. 사용하지 않는 컬럼 삭제
ALTER TABLE raw_materials
  DROP COLUMN IF EXISTS category_level_1_id,
  DROP COLUMN IF EXISTS category_level_2_id,
  DROP COLUMN IF EXISTS category_level_3_id,
  DROP COLUMN IF EXISTS category_level_4_id,
  DROP COLUMN IF EXISTS category_level_5_id,
  DROP COLUMN IF EXISTS category_level_6_id,
  DROP COLUMN IF EXISTS item_type,
  DROP COLUMN IF EXISTS variety;

-- 2. 컬럼 주석 추가 (category_settings와 동일한 의미)
COMMENT ON COLUMN raw_materials.category_1 IS '대분류 (category_settings.category_1과 매칭)';
COMMENT ON COLUMN raw_materials.category_2 IS '중분류 (category_settings.category_2와 매칭)';
COMMENT ON COLUMN raw_materials.category_3 IS '소분류 (category_settings.category_3과 매칭)';
COMMENT ON COLUMN raw_materials.category_4 IS '품목 (category_settings.category_4와 매칭)';
COMMENT ON COLUMN raw_materials.category_5 IS '품종 (category_settings.category_5와 매칭)';

-- 3. 인덱스 확인 및 생성 (이미 있다면 스킵)
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_1 ON raw_materials(category_1);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_2 ON raw_materials(category_2);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_3 ON raw_materials(category_3);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_4 ON raw_materials(category_4);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_5 ON raw_materials(category_5);

-- 4. material_categories 테이블은 현재 사용하지 않으므로 그대로 유지
-- (향후 필요시 활용 가능하도록 삭제하지 않음)

-- 5. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'raw_materials 테이블 정리 완료';
  RAISE NOTICE '- 불필요한 카테고리 ID 필드 삭제';
  RAISE NOTICE '- category_1~5는 category_settings와 동일한 구조로 유지';
  RAISE NOTICE '- 인덱스 생성 완료';
END $$;
