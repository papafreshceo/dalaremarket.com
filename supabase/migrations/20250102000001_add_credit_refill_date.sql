-- user_credits 테이블에 마지막 리필 날짜 컬럼 추가
ALTER TABLE user_credits
ADD COLUMN IF NOT EXISTS last_refill_date DATE DEFAULT CURRENT_DATE;

-- 기존 레코드들도 오늘 날짜로 초기화
UPDATE user_credits
SET last_refill_date = CURRENT_DATE
WHERE last_refill_date IS NULL;
