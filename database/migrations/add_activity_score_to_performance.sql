-- seller_performance_daily 테이블에 활동점수 필드 추가

-- 활동점수 필드 추가
ALTER TABLE seller_performance_daily
ADD COLUMN IF NOT EXISTS consecutive_order_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consecutive_order_bonus DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS post_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS login_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS activity_score DECIMAL(10,2) DEFAULT 0;

-- 활동점수 필드에 대한 코멘트
COMMENT ON COLUMN seller_performance_daily.consecutive_order_days IS '연속 발주 일수';
COMMENT ON COLUMN seller_performance_daily.consecutive_order_bonus IS '연속 발주 보너스 점수';
COMMENT ON COLUMN seller_performance_daily.post_score IS '셀러피드 게시글 작성 점수';
COMMENT ON COLUMN seller_performance_daily.comment_score IS '답글 작성 점수';
COMMENT ON COLUMN seller_performance_daily.login_score IS '로그인 점수';
COMMENT ON COLUMN seller_performance_daily.activity_score IS '활동점수 합계 (연속발주 + 게시글 + 답글 + 로그인)';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_seller_performance_activity_score ON seller_performance_daily(activity_score DESC);
