-- ===========================
-- NaN 값 정리
-- ===========================
-- mapping_settings 테이블의 NaN 값을 NULL로 변경

-- header_row의 NaN 또는 NULL 값을 1로 변경
UPDATE mapping_settings
SET header_row = 1
WHERE header_row IS NULL OR header_row::text = 'NaN';

-- display_order가 NULL인 경우 순서 자동 부여
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY market_name) as new_order
  FROM mapping_settings
  WHERE display_order IS NULL
)
UPDATE mapping_settings m
SET display_order = n.new_order
FROM numbered n
WHERE m.id = n.id;
