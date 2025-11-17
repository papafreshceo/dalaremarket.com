-- Migration 077: 이메일 인증 자동 동기화 트리거
-- email_verifications 테이블에서 verified=true가 되면 users 테이블도 자동 업데이트

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION sync_email_verification_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- verified가 true로 변경되었을 때만 실행
  IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
    -- users 테이블 업데이트
    UPDATE users
    SET
      email_verified = true,
      email_verified_at = NOW(),
      updated_at = NOW()
    WHERE email = NEW.email;

    RAISE NOTICE '이메일 인증 동기화 완료: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS trigger_sync_email_verification ON email_verifications;

CREATE TRIGGER trigger_sync_email_verification
  AFTER INSERT OR UPDATE ON email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_verification_to_users();

-- 3. 설명
COMMENT ON FUNCTION sync_email_verification_to_users() IS '이메일 인증 완료 시 users 테이블에 자동 동기화';
COMMENT ON TRIGGER trigger_sync_email_verification ON email_verifications IS '이메일 인증 완료 시 users.email_verified를 자동 업데이트';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 이메일 인증 자동 동기화 트리거 생성 완료';
  RAISE NOTICE '   - email_verifications.verified = true 되면';
  RAISE NOTICE '   - users.email_verified = true 자동 업데이트';
END $$;
