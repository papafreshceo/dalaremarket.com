-- 셀러 일별 성과 지표 테이블
-- 매일 자정에 집계되는 셀러의 성과 데이터

CREATE TABLE IF NOT EXISTS seller_performance_daily (
  id SERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- 매출 지표
  total_sales NUMERIC DEFAULT 0,
  order_count INTEGER DEFAULT 0,

  -- 처리 속도 지표
  avg_confirm_hours NUMERIC,  -- 평균 발주확정 시간 (시간 단위)
  same_day_confirm_count INTEGER DEFAULT 0,  -- 당일 발주확정 건수
  total_confirm_hours NUMERIC DEFAULT 0,  -- 총 발주확정 시간 (계산용)

  -- 취소 지표
  cancel_count INTEGER DEFAULT 0,
  cancel_rate NUMERIC,  -- 취소율 (%)

  -- 품질 지표
  upload_count INTEGER DEFAULT 0,  -- 엑셀 업로드 횟수
  error_count INTEGER DEFAULT 0,   -- 데이터 오류 건수
  error_rate NUMERIC,  -- 오류율 (%)

  -- 점수 (0-100)
  sales_score NUMERIC,  -- 매출 점수
  order_count_score NUMERIC,  -- 주문건수 점수
  confirm_speed_score NUMERIC,  -- 발주확정 속도 점수
  cancel_rate_score NUMERIC,  -- 취소율 점수
  data_quality_score NUMERIC,  -- 데이터 품질 점수
  total_score NUMERIC,  -- 종합 점수

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 하나의 셀러는 하루에 하나의 레코드만 가짐
  UNIQUE(seller_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_seller_performance_seller_date
  ON seller_performance_daily(seller_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_seller_performance_date
  ON seller_performance_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_seller_performance_total_score
  ON seller_performance_daily(total_score DESC);

-- 코멘트
COMMENT ON TABLE seller_performance_daily IS '셀러 일별 성과 지표 - 매일 자정 집계';
COMMENT ON COLUMN seller_performance_daily.avg_confirm_hours IS '평균 발주확정 시간 (시간 단위)';
COMMENT ON COLUMN seller_performance_daily.cancel_rate IS '취소율 (%)';
COMMENT ON COLUMN seller_performance_daily.error_rate IS '데이터 오류율 (%)';
COMMENT ON COLUMN seller_performance_daily.total_score IS '종합 점수 (0-100)';
-- 셀러 랭킹 테이블
-- 기간별(일/주/월/연) 셀러 순위 및 등급 정보

CREATE TABLE IF NOT EXISTS seller_rankings (
  id SERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- 집계 데이터
  total_sales NUMERIC DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  avg_confirm_hours NUMERIC,  -- 평균 발주확정 시간
  cancel_rate NUMERIC,  -- 취소율 (%)
  data_quality_rate NUMERIC,  -- 데이터 품질률 (100 - 오류율)

  -- 점수 및 순위
  sales_score NUMERIC,  -- 매출 점수 (30%)
  order_count_score NUMERIC,  -- 주문건수 점수 (20%)
  confirm_speed_score NUMERIC,  -- 발주확정 속도 점수 (20%)
  cancel_rate_score NUMERIC,  -- 취소율 점수 (20%)
  data_quality_score NUMERIC,  -- 데이터 품질 점수 (10%)
  total_score NUMERIC,  -- 종합 점수 (0-100)

  rank INTEGER,  -- 순위 (1, 2, 3, ...)
  tier TEXT,  -- 등급 'diamond', 'platinum', 'gold', 'silver', 'bronze'

  -- 전월/전주 대비
  prev_rank INTEGER,
  rank_change INTEGER,  -- 순위 변동 (양수: 상승, 음수: 하락)
  prev_total_score NUMERIC,
  score_change NUMERIC,  -- 점수 변동

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 하나의 셀러는 하나의 기간에 하나의 랭킹만 가짐
  UNIQUE(seller_id, period_type, period_start)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_seller_rankings_period
  ON seller_rankings(period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_seller_rankings_rank
  ON seller_rankings(period_type, rank ASC);
CREATE INDEX IF NOT EXISTS idx_seller_rankings_seller
  ON seller_rankings(seller_id, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_seller_rankings_tier
  ON seller_rankings(tier, period_type);

-- 코멘트
COMMENT ON TABLE seller_rankings IS '셀러 기간별 랭킹 및 등급 정보';
COMMENT ON COLUMN seller_rankings.period_type IS '기간 타입: daily, weekly, monthly, yearly';
COMMENT ON COLUMN seller_rankings.tier IS '등급: diamond, platinum, gold, silver, bronze';
COMMENT ON COLUMN seller_rankings.rank_change IS '순위 변동 (양수: 상승, 음수: 하락)';
-- 셀러 배지 획득 기록 테이블
-- 셀러가 달성한 업적(배지)을 기록

CREATE TABLE IF NOT EXISTS seller_badges (
  id SERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,  -- 배지 고유 ID
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_month DATE,  -- 어느 월에 획득했는지 (YYYY-MM-01 형식)

  -- 배지 획득 당시 데이터 (참고용)
  metadata JSONB,  -- 배지 획득 시점의 상세 정보

  -- 한 셀러는 같은 월에 같은 배지를 중복 획득할 수 없음
  UNIQUE(seller_id, badge_id, period_month)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_seller_badges_seller
  ON seller_badges(seller_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_badges_badge
  ON seller_badges(badge_id, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_seller_badges_month
  ON seller_badges(period_month DESC);

-- 코멘트
COMMENT ON TABLE seller_badges IS '셀러 배지 획득 기록';
COMMENT ON COLUMN seller_badges.badge_id IS '배지 ID: fast_confirmer, no_cancel, volume_king, perfect_data, consistent, early_bird';
COMMENT ON COLUMN seller_badges.period_month IS '획득 월 (YYYY-MM-01)';
COMMENT ON COLUMN seller_badges.metadata IS '배지 획득 당시의 상세 정보 (JSON)';

-- 배지 정의 상수 테이블 (참고용)
CREATE TABLE IF NOT EXISTS badge_definitions (
  badge_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 배지 삽입
INSERT INTO badge_definitions (badge_id, name, description, icon, condition_description) VALUES
  ('fast_confirmer', '빠른 발주', '평균 발주확정 시간 1시간 이내', '⚡', '월간 평균 발주확정 시간이 1시간 이내일 때'),
  ('no_cancel', '무결점', '취소율 1% 미만 달성', '✨', '월간 취소율이 1% 미만일 때'),
  ('volume_king', '볼륨왕', '월간 주문 1,000건 이상', '👑', '월간 주문이 1,000건 이상일 때'),
  ('perfect_data', '완벽 데이터', '데이터 오류율 0%', '💯', '월간 데이터 오류율이 0%일 때'),
  ('consistent', '꾸준함', '3개월 연속 발주확정', '🔥', '3개월 연속 발주확정을 한 경우'),
  ('early_bird', '얼리버드', '오전 9시 이전 발주확정 80% 이상', '🌅', '월간 오전 9시 이전 발주확정 비율이 80% 이상일 때')
ON CONFLICT (badge_id) DO NOTHING;

COMMENT ON TABLE badge_definitions IS '배지 정의 상수 테이블';
