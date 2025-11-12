-- =====================================================
-- 캐시/크레딧 테이블 이름 변경
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - user_cash → organization_cash
--   - user_credits → organization_credits
--   - 조직 단위 관리를 명확히 하기 위한 이름 변경
-- =====================================================

-- 1. user_cash 테이블 이름 변경
ALTER TABLE user_cash RENAME TO organization_cash;

-- 2. user_credits 테이블 이름 변경
ALTER TABLE user_credits RENAME TO organization_credits;

-- 3. user_cash_transactions 테이블 이름 변경
ALTER TABLE user_cash_transactions RENAME TO organization_cash_transactions;

-- 4. user_credit_transactions 테이블 이름 변경
ALTER TABLE user_credit_transactions RENAME TO organization_credit_transactions;

-- 5. user_cash_history 테이블 이름 변경
ALTER TABLE user_cash_history RENAME TO organization_cash_history;

-- 6. user_credits_history 테이블 이름 변경
ALTER TABLE user_credits_history RENAME TO organization_credits_history;

-- 7. user_daily_rewards 테이블 이름 변경 및 구조 변경
ALTER TABLE user_daily_rewards RENAME TO organization_daily_rewards;

-- user_id를 organization_id로 변경
ALTER TABLE organization_daily_rewards
RENAME COLUMN user_id TO organization_id;

-- 기존 제약조건 제거 후 새로운 제약조건 추가
ALTER TABLE organization_daily_rewards
DROP CONSTRAINT IF EXISTS user_daily_rewards_pkey CASCADE,
DROP CONSTRAINT IF EXISTS user_daily_rewards_user_id_reward_date_key CASCADE;

-- 조직별 날짜 유니크 제약 추가 (하루 1회만 가능)
ALTER TABLE organization_daily_rewards
ADD CONSTRAINT organization_daily_rewards_pkey PRIMARY KEY (organization_id, reward_date);

-- 8. 인덱스 이름도 변경 (있다면)
ALTER INDEX IF EXISTS idx_user_cash_organization_id RENAME TO idx_organization_cash_organization_id;
ALTER INDEX IF EXISTS idx_user_credits_organization_id RENAME TO idx_organization_credits_organization_id;
ALTER INDEX IF EXISTS idx_user_cash_transactions_user_id RENAME TO idx_organization_cash_transactions_user_id;
ALTER INDEX IF EXISTS idx_user_credit_transactions_user_id RENAME TO idx_organization_credit_transactions_user_id;
ALTER INDEX IF EXISTS idx_user_cash_history_user_id RENAME TO idx_organization_cash_history_user_id;
ALTER INDEX IF EXISTS idx_user_credits_history_user_id RENAME TO idx_organization_credits_history_user_id;

-- 9. 주석 추가
COMMENT ON TABLE organization_cash IS '조직 캐시 잔액 (organization_id 기준)';
COMMENT ON TABLE organization_credits IS '조직 크레딧 잔액 (organization_id 기준)';
COMMENT ON TABLE organization_cash_transactions IS '조직 캐시 거래 내역';
COMMENT ON TABLE organization_credit_transactions IS '조직 크레딧 거래 내역';
COMMENT ON TABLE organization_cash_history IS '조직 캐시 지급/회수 내역';
COMMENT ON TABLE organization_credits_history IS '조직 크레딧 지급/회수 내역';
COMMENT ON TABLE organization_daily_rewards IS '조직 일일 보상 기록 (하루 1회 중복 방지)';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 테이블 이름 변경 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경된 테이블:';
  RAISE NOTICE '- user_cash → organization_cash';
  RAISE NOTICE '- user_credits → organization_credits';
  RAISE NOTICE '- user_cash_transactions → organization_cash_transactions';
  RAISE NOTICE '- user_credit_transactions → organization_credit_transactions';
  RAISE NOTICE '- user_cash_history → organization_cash_history';
  RAISE NOTICE '- user_credits_history → organization_credits_history';
  RAISE NOTICE '- user_daily_rewards → organization_daily_rewards (user_id → organization_id)';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '⚠️  중요: organization_daily_rewards는 조직별 하루 1회만 보상 가능';
  RAISE NOTICE '=================================================';
END $$;
