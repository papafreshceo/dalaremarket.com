-- =====================================================
-- 현재 user_cash와 user_credits의 제약 조건 확인
-- =====================================================

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid IN ('user_cash'::regclass, 'user_credits'::regclass)
  AND contype = 'u'
ORDER BY conrelid::regclass::text, conname;
