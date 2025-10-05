-- ============================================
-- option_products supply_status 제약 조건 수정
-- 한글 이름 → 코드값으로 변경
-- ============================================

-- 기존 제약 조건 삭제
ALTER TABLE option_products
DROP CONSTRAINT IF EXISTS product_options_supply_status_check;

-- 새로운 제약 조건 추가 (코드값 사용)
ALTER TABLE option_products
ADD CONSTRAINT product_options_supply_status_check
CHECK (supply_status IN ('PREPARING', 'SUPPLYING', 'PAUSED', 'STOPPED', 'SEASON_END'));

-- 확인
SELECT '제약 조건 수정 완료' as status;
