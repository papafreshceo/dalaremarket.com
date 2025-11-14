-- =====================================================
-- 티어 등급명을 대문자로 통일
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: tier_criteria 테이블의 tier 값을 대문자로 변경
--       (diamond → DIAMOND, platinum → PLATINUM 등)
--       조직 티어 시스템과 일관성 유지
-- =====================================================

-- 1. tier_criteria 테이블의 tier 값을 대문자로 업데이트
UPDATE tier_criteria SET tier = 'DIAMOND' WHERE tier = 'diamond';
UPDATE tier_criteria SET tier = 'PLATINUM' WHERE tier = 'platinum';
UPDATE tier_criteria SET tier = 'GOLD' WHERE tier = 'gold';
UPDATE tier_criteria SET tier = 'SILVER' WHERE tier = 'silver';
UPDATE tier_criteria SET tier = 'BRONZE' WHERE tier = 'bronze';

-- 2. 새로운 대문자 tier가 없으면 추가 (LIGHT, STANDARD 등)
INSERT INTO tier_criteria (tier, min_order_count, min_total_sales, discount_rate, consecutive_months_for_bonus, bonus_tier_duration_months, description) VALUES
  ('LEGEND', 1000, 100000000, 15.0, 3, 1, '월 1000건 이상 + 1억원 이상 (15% 할인)'),
  ('ELITE', 700, 70000000, 12.5, 3, 1, '월 700건 이상 + 7천만원 이상 (12.5% 할인)'),
  ('ADVANCE', 400, 40000000, 9.0, 3, 1, '월 400건 이상 + 4천만원 이상 (9% 할인)'),
  ('STANDARD', 100, 10000000, 4.0, 3, 1, '월 100건 이상 + 1천만원 이상 (4% 할인)'),
  ('LIGHT', 1, 1, 0, NULL, 1, '월 1건 이상 (할인 없음)')
ON CONFLICT (tier) DO UPDATE SET
  min_order_count = EXCLUDED.min_order_count,
  min_total_sales = EXCLUDED.min_total_sales,
  discount_rate = EXCLUDED.discount_rate,
  consecutive_months_for_bonus = EXCLUDED.consecutive_months_for_bonus,
  bonus_tier_duration_months = EXCLUDED.bonus_tier_duration_months,
  description = EXCLUDED.description;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '티어 등급명 대문자 변환 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- tier_criteria 테이블 tier 값 대문자로 변경';
  RAISE NOTICE '- LEGEND, ELITE, ADVANCE, STANDARD, LIGHT 등급 추가/업데이트';
  RAISE NOTICE '=================================================';
END $$;
