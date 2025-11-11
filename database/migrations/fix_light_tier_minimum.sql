-- LIGHT 등급의 최소 조건을 설정
-- 0점/0실적 사용자는 무등급이 되도록 함

-- LIGHT 등급의 최소 조건을 1건 이상으로 설정
UPDATE tier_criteria
SET
  min_order_count = 1,
  min_total_sales = 1000,
  description = '3개월간 1건 이상 + 1천원 이상'
WHERE tier IN ('LIGHT', 'bronze');

-- 확인
SELECT tier, min_order_count, min_total_sales, description
FROM tier_criteria
ORDER BY min_total_sales ASC;
