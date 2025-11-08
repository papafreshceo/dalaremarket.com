-- 중복된 크레딧 시스템 정리
-- 기존 user_credits 테이블과 user_credit_transactions 테이블을 사용
-- 새로 만든 중복 테이블과 컬럼 제거

-- 1. user_credit_history 테이블 삭제 (중복)
DROP TABLE IF EXISTS user_credit_history CASCADE;

-- 2. users.credits 컬럼 삭제 (중복, 기존 user_credits 테이블 사용)
ALTER TABLE users DROP COLUMN IF EXISTS credits;

-- 3. use_credits() 함수 삭제 (더 이상 사용하지 않음)
DROP FUNCTION IF EXISTS use_credits(UUID, TEXT, INTEGER);

-- 확인: 기존 크레딧 시스템 테이블 확인
SELECT
  'user_credits' as table_name,
  COUNT(*) as record_count
FROM user_credits
UNION ALL
SELECT
  'user_credit_transactions' as table_name,
  COUNT(*) as record_count
FROM user_credit_transactions;
