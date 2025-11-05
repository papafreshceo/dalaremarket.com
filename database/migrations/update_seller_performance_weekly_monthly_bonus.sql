-- seller_performance_daily 테이블 업데이트: 연속발주 컬럼을 주간/월간으로 변경

-- 기존 컬럼 삭제
ALTER TABLE seller_performance_daily
DROP COLUMN IF EXISTS consecutive_order_days,
DROP COLUMN IF EXISTS consecutive_order_bonus;

-- 새로운 컬럼 추가
ALTER TABLE seller_performance_daily
ADD COLUMN IF NOT EXISTS weekly_consecutive_bonus DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_consecutive_bonus DECIMAL(10,2) DEFAULT 0;

-- activity_score 계산에 주간/월간 보너스 포함
COMMENT ON COLUMN seller_performance_daily.weekly_consecutive_bonus IS '주간 연속발주 보너스 (일요일~금요일 6일 연속 발주 시, 토요일 가산)';
COMMENT ON COLUMN seller_performance_daily.monthly_consecutive_bonus IS '월간 연속발주 보너스 (1일~마지막일 토요일 제외한 모든 날 발주 시, 다음달 1일 가산)';
