-- 중복된 카테고리 데이터 제거 (가장 최근 것만 유지)

-- 1. 중복 확인 쿼리 (실행 전 확인용)
SELECT
  expense_type,
  category_1,
  category_2,
  category_3,
  category_4,
  category_5,
  COUNT(*) as count
FROM category_settings
GROUP BY expense_type, category_1, category_2, category_3, category_4, category_5
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. 중복 제거 (가장 최근 created_at를 가진 레코드만 유지)
DELETE FROM category_settings
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY
          COALESCE(expense_type, ''),
          COALESCE(category_1, ''),
          COALESCE(category_2, ''),
          COALESCE(category_3, ''),
          COALESCE(category_4, ''),
          COALESCE(category_5, '')
        ORDER BY created_at DESC
      ) as rn
    FROM category_settings
  ) t
  WHERE rn > 1
);

-- 3. 중복 제거 후 확인
SELECT
  expense_type,
  category_1,
  category_2,
  category_3,
  category_4,
  category_5,
  COUNT(*) as count
FROM category_settings
GROUP BY expense_type, category_1, category_2, category_3, category_4, category_5
HAVING COUNT(*) > 1;

-- 4. 유니크 제약조건 추가 (선택사항 - 향후 중복 방지)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_category_unique
-- ON category_settings (
--   COALESCE(expense_type, ''),
--   COALESCE(category_1, ''),
--   COALESCE(category_2, ''),
--   COALESCE(category_3, ''),
--   COALESCE(category_4, ''),
--   COALESCE(category_5, '')
-- );
