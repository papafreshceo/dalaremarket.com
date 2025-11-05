-- seller_rankings 테이블에 보상 관련 컬럼 추가

-- 보상 캐시 금액
ALTER TABLE seller_rankings
ADD COLUMN IF NOT EXISTS reward_cash INTEGER DEFAULT 0;

-- 랭킹 확정 여부 (주간: 토요일, 월간: 다음달 1일에 확정)
ALTER TABLE seller_rankings
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

-- 보상 지급 시간
ALTER TABLE seller_rankings
ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMP WITH TIME ZONE;

-- 코멘트
COMMENT ON COLUMN seller_rankings.reward_cash IS '보상 캐시 금액 (주간/월간만 지급)';
COMMENT ON COLUMN seller_rankings.is_finalized IS '랭킹 확정 여부 (주간: 토요일, 월간: 다음달 1일)';
COMMENT ON COLUMN seller_rankings.rewarded_at IS '보상 지급 시간';
