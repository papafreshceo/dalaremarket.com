-- =====================================================
-- 불필요한 컬럼 삭제
-- =====================================================
-- 작성일: 2025-01-26
-- 설명: 사용하지 않는 컬럼들 제거
-- =====================================================

-- 1. 사용하지 않는 옵션명 관련 컬럼 삭제
ALTER TABLE option_products DROP COLUMN IF EXISTS is_best;
ALTER TABLE option_products DROP COLUMN IF EXISTS is_recommended;
ALTER TABLE option_products DROP COLUMN IF EXISTS has_detail_page;
ALTER TABLE option_products DROP COLUMN IF EXISTS has_images;
ALTER TABLE option_products DROP COLUMN IF EXISTS option_name_1;
ALTER TABLE option_products DROP COLUMN IF EXISTS option_name_2;
ALTER TABLE option_products DROP COLUMN IF EXISTS option_name_3;

-- 2. 시즌 관련 컬럼 삭제 (더 이상 사용하지 않음)
ALTER TABLE option_products DROP COLUMN IF EXISTS season_start_date;
ALTER TABLE option_products DROP COLUMN IF EXISTS season_end_date;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '불필요한 컬럼 삭제 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '삭제된 컬럼:';
  RAISE NOTICE '  - is_best, is_recommended, has_detail_page, has_images';
  RAISE NOTICE '  - option_name_1, option_name_2, option_name_3';
  RAISE NOTICE '  - season_start_date, season_end_date';
  RAISE NOTICE '=================================================';
END $$;
