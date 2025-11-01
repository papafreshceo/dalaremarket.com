-- 달래캐시 시스템 테이블 생성

-- 1. 사용자별 캐시 잔액 테이블
CREATE TABLE IF NOT EXISTS user_cash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. 캐시 거래 이력 테이블
CREATE TABLE IF NOT EXISTS user_cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'login', 'activity', 'usage', 'admin_adjustment'
  amount INTEGER NOT NULL, -- 양수(적립) 또는 음수(사용)
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  description TEXT,
  metadata JSONB, -- 추가 정보 (예: 사용처, 주문 ID 등)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 캐시 설정 테이블 (관리자용)
CREATE TABLE IF NOT EXISTS cash_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_reward INTEGER NOT NULL DEFAULT 50 CHECK (login_reward >= 0),
  activity_reward_per_minute INTEGER NOT NULL DEFAULT 1 CHECK (activity_reward_per_minute >= 0),
  daily_activity_limit INTEGER NOT NULL DEFAULT 50 CHECK (daily_activity_limit >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 4. 일일 포인트 지급 추적 테이블
CREATE TABLE IF NOT EXISTS user_daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_date DATE NOT NULL,
  login_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  activity_minutes_rewarded INTEGER NOT NULL DEFAULT 0,
  activity_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_cash_user_id ON user_cash(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_user_id ON user_cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_created_at ON user_cash_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_type ON user_cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_user_daily_rewards_user_id_date ON user_daily_rewards(user_id, reward_date DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_cash_updated_at
  BEFORE UPDATE ON user_cash
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_rewards_updated_at
  BEFORE UPDATE ON user_daily_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_settings_updated_at
  BEFORE UPDATE ON cash_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 캐시 설정 데이터 삽입
INSERT INTO cash_settings (login_reward, activity_reward_per_minute, daily_activity_limit)
VALUES (50, 1, 50)
ON CONFLICT DO NOTHING;

-- RLS (Row Level Security) 활성화
ALTER TABLE user_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_rewards ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view their own cash balance"
  ON user_cash FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cash transactions"
  ON user_cash_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily rewards"
  ON user_daily_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 모든 사용자가 캐시 설정 조회 가능
CREATE POLICY "Anyone can view cash settings"
  ON cash_settings FOR SELECT
  TO authenticated
  USING (true);

-- 코멘트 추가
COMMENT ON TABLE user_cash IS '사용자별 달래캐시 잔액';
COMMENT ON TABLE user_cash_transactions IS '달래캐시 거래 이력';
COMMENT ON TABLE cash_settings IS '달래캐시 시스템 설정 (관리자용)';
COMMENT ON TABLE user_daily_rewards IS '일일 포인트 지급 추적';
