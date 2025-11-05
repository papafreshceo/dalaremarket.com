-- 랭킹 점수 설정 테이블 업데이트: 7일/14일/30일 → 주간/월간 연속발주 보너스로 변경

-- 기존 컬럼 삭제
ALTER TABLE ranking_score_settings
DROP COLUMN IF EXISTS consecutive_7_days,
DROP COLUMN IF EXISTS consecutive_14_days,
DROP COLUMN IF EXISTS consecutive_30_days;

-- 새로운 컬럼 추가
ALTER TABLE ranking_score_settings
ADD COLUMN IF NOT EXISTS weekly_consecutive_bonus INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS monthly_consecutive_bonus INTEGER NOT NULL DEFAULT 500;

-- 코멘트 업데이트
COMMENT ON COLUMN ranking_score_settings.weekly_consecutive_bonus IS '주간 연속발주 보너스 (일요일~금요일 6일 연속 발주 시, 토요일 가산)';
COMMENT ON COLUMN ranking_score_settings.monthly_consecutive_bonus IS '월간 연속발주 보너스 (1일~마지막일 토요일 제외한 모든 날 발주 시, 다음달 1일 가산)';

-- 기존 데이터 초기화
UPDATE ranking_score_settings
SET
  weekly_consecutive_bonus = 50,
  monthly_consecutive_bonus = 500
WHERE id = '00000000-0000-0000-0000-000000000001';
