-- 캐시 지급/회수 내역 테이블
CREATE TABLE IF NOT EXISTS user_cash_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'grant' 또는 'revoke'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_cash_history_user_id ON user_cash_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cash_history_created_at ON user_cash_history(created_at DESC);

COMMENT ON TABLE user_cash_history IS '캐시 지급/회수 내역';
COMMENT ON COLUMN user_cash_history.transaction_type IS 'grant: 지급, revoke: 회수';
