-- user_cash_history 테이블에 is_revoked 컬럼 추가
ALTER TABLE user_cash_history
ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE;

-- is_revoked 컬럼에 인덱스 생성 (회수 여부 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_cash_history_is_revoked ON user_cash_history(is_revoked);

COMMENT ON COLUMN user_cash_history.is_revoked IS '지급 내역이 회수되었는지 여부 (grant 타입에만 적용)';
