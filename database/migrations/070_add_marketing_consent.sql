-- Migration 070: Add marketing consent to users table
-- 마케팅 정보 수신 동의 컬럼 추가

ALTER TABLE users
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_marketing_consent
ON users(marketing_consent);

COMMENT ON COLUMN users.marketing_consent IS '마케팅 정보 수신 동의 여부 (이메일, SMS, 푸시)';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ marketing_consent 컬럼 추가 완료';
  RAISE NOTICE '- 기본값: FALSE (동의하지 않음)';
  RAISE NOTICE '- 회원가입 시 사용자가 선택 가능';
  RAISE NOTICE '- 마케팅 이메일/SMS 발송 시 이 값을 기준으로 필터링';
END $$;
