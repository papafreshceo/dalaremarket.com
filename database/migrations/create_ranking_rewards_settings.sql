-- 랭킹 보상 설정 테이블
-- 주간/월간 랭킹 순위별 보상 캐시 금액 설정

CREATE TABLE IF NOT EXISTS ranking_rewards_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL, -- 'weekly', 'monthly'
  rank INTEGER NOT NULL, -- 순위 (1, 2, 3, ...)
  reward_cash INTEGER NOT NULL DEFAULT 0, -- 보상 캐시 금액

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 하나의 기간 타입에 하나의 순위는 하나의 보상만 가짐
  UNIQUE(period_type, rank)
);

-- 기본 보상 설정 삽입 (주간 랭킹)
INSERT INTO ranking_rewards_settings (period_type, rank, reward_cash) VALUES
  ('weekly', 1, 100000),
  ('weekly', 2, 50000),
  ('weekly', 3, 30000),
  ('weekly', 4, 20000),
  ('weekly', 5, 10000)
ON CONFLICT (period_type, rank) DO NOTHING;

-- 기본 보상 설정 삽입 (월간 랭킹)
INSERT INTO ranking_rewards_settings (period_type, rank, reward_cash) VALUES
  ('monthly', 1, 500000),
  ('monthly', 2, 300000),
  ('monthly', 3, 200000),
  ('monthly', 4, 150000),
  ('monthly', 5, 100000),
  ('monthly', 6, 80000),
  ('monthly', 7, 60000),
  ('monthly', 8, 50000),
  ('monthly', 9, 40000),
  ('monthly', 10, 30000)
ON CONFLICT (period_type, rank) DO NOTHING;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ranking_rewards_period
  ON ranking_rewards_settings(period_type, rank ASC);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_ranking_rewards_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ranking_rewards_settings_updated_at
  BEFORE UPDATE ON ranking_rewards_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ranking_rewards_settings_updated_at();

-- 코멘트
COMMENT ON TABLE ranking_rewards_settings IS '랭킹 보상 설정 - 주간/월간 순위별 캐시 보상';
COMMENT ON COLUMN ranking_rewards_settings.period_type IS 'weekly: 주간, monthly: 월간';
COMMENT ON COLUMN ranking_rewards_settings.rank IS '순위 (1위, 2위, 3위...)';
COMMENT ON COLUMN ranking_rewards_settings.reward_cash IS '보상 캐시 금액';
