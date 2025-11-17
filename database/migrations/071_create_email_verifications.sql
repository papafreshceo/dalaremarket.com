-- Migration 071: Create email_verifications table
-- 이메일 인증 코드 관리 테이블

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 이메일과 생성 시간으로 인덱스 (최신 코드 조회용)
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_created
ON email_verifications(email, created_at DESC);

-- 만료 시간 인덱스 (정리용)
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires
ON email_verifications(expires_at);

-- 이메일별 인증 여부 인덱스
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_verified
ON email_verifications(email, verified);

COMMENT ON TABLE email_verifications IS '이메일 인증 코드 관리 테이블';
COMMENT ON COLUMN email_verifications.email IS '인증할 이메일 주소';
COMMENT ON COLUMN email_verifications.code IS '6자리 인증 코드';
COMMENT ON COLUMN email_verifications.verified IS '인증 완료 여부';
COMMENT ON COLUMN email_verifications.expires_at IS '인증 코드 만료 시간 (발급 후 5분)';

-- 만료된 인증 코드 자동 삭제 함수
CREATE OR REPLACE FUNCTION delete_expired_verifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_verifications
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

COMMENT ON FUNCTION delete_expired_verifications() IS '만료된 인증 코드 삭제 (1일 이상 지난 것)';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ email_verifications 테이블 생성 완료';
  RAISE NOTICE '- 6자리 인증 코드 저장';
  RAISE NOTICE '- 5분 유효시간';
  RAISE NOTICE '- 인증 완료 여부 추적';
END $$;
