-- Migration 069: Add push notifications consent to users table
-- 푸시 알림 동의 컬럼 추가

ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT FALSE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_push_notifications_enabled
ON users(push_notifications_enabled);

COMMENT ON COLUMN users.push_notifications_enabled IS '푸시 알림 수신 동의 여부';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ push_notifications_enabled 컬럼 추가 완료';
  RAISE NOTICE '- 기본값: FALSE (동의하지 않음)';
  RAISE NOTICE '- 회원가입 시 사용자가 선택 가능';
END $$;
