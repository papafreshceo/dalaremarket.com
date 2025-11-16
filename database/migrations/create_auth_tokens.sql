-- 인증 토큰 테이블 생성
-- 이메일 인증, 비밀번호 재설정, 초대 등에 사용

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGSERIAL PRIMARY KEY,

  -- 토큰 정보
  token VARCHAR(255) UNIQUE NOT NULL, -- UUID 토큰
  type VARCHAR(50) NOT NULL, -- email_verification, password_reset, invitation

  -- 사용자 정보
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 기존 사용자 (비밀번호 재설정 등)
  email VARCHAR(255) NOT NULL, -- 이메일 주소

  -- 초대 관련 (type='invitation'일 때만)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  role VARCHAR(20), -- 초대할 역할 (owner, member, viewer 등)

  -- 상태
  is_used BOOLEAN DEFAULT FALSE, -- 사용 여부
  used_at TIMESTAMPTZ, -- 사용 시간
  expires_at TIMESTAMPTZ NOT NULL, -- 만료 시간

  -- 메타데이터
  metadata JSONB DEFAULT '{}', -- 추가 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_token_type CHECK (type IN ('email_verification', 'password_reset', 'invitation'))
);

-- 인덱스 생성
CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX idx_auth_tokens_type ON auth_tokens(type);
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_organization_id ON auth_tokens(organization_id);

-- RLS 정책 활성화
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 토큰만 조회 가능
CREATE POLICY "사용자는 자신의 토큰 조회 가능"
  ON auth_tokens
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- 관리자는 모든 토큰 조회 가능
CREATE POLICY "관리자는 모든 토큰 조회 가능"
  ON auth_tokens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'employee')
    )
  );

-- 인증되지 않은 사용자도 토큰 조회 가능 (이메일 인증용)
CREATE POLICY "누구나 토큰 조회 가능"
  ON auth_tokens
  FOR SELECT
  TO anon
  USING (true);

-- users 테이블에 email_verified 컬럼 추가 (이미 있을 수 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
  END IF;
END $$;

-- 토큰 생성 함수
CREATE OR REPLACE FUNCTION generate_auth_token(
  p_type VARCHAR,
  p_email VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_invited_by UUID DEFAULT NULL,
  p_role VARCHAR DEFAULT NULL,
  p_expires_hours INT DEFAULT 24
)
RETURNS TABLE(token VARCHAR, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_token VARCHAR;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- UUID 토큰 생성
  v_token := gen_random_uuid()::TEXT;
  v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;

  -- 토큰 저장
  INSERT INTO auth_tokens (
    token,
    type,
    email,
    user_id,
    organization_id,
    invited_by,
    role,
    expires_at
  ) VALUES (
    v_token,
    p_type,
    p_email,
    p_user_id,
    p_organization_id,
    p_invited_by,
    p_role,
    v_expires_at
  );

  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 토큰 검증 함수
CREATE OR REPLACE FUNCTION verify_auth_token(p_token VARCHAR)
RETURNS TABLE(
  id BIGINT,
  type VARCHAR,
  email VARCHAR,
  user_id UUID,
  organization_id UUID,
  role VARCHAR,
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  -- 토큰 조회
  SELECT * INTO v_token_record
  FROM auth_tokens
  WHERE token = p_token;

  -- 토큰이 없음
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::BIGINT, NULL::VARCHAR, NULL::VARCHAR, NULL::UUID, NULL::UUID, NULL::VARCHAR,
      FALSE, '유효하지 않은 토큰입니다.'::TEXT;
    RETURN;
  END IF;

  -- 이미 사용됨
  IF v_token_record.is_used THEN
    RETURN QUERY SELECT
      v_token_record.id, v_token_record.type, v_token_record.email,
      v_token_record.user_id, v_token_record.organization_id, v_token_record.role,
      FALSE, '이미 사용된 토큰입니다.'::TEXT;
    RETURN;
  END IF;

  -- 만료됨
  IF v_token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT
      v_token_record.id, v_token_record.type, v_token_record.email,
      v_token_record.user_id, v_token_record.organization_id, v_token_record.role,
      FALSE, '만료된 토큰입니다.'::TEXT;
    RETURN;
  END IF;

  -- 유효한 토큰
  RETURN QUERY SELECT
    v_token_record.id, v_token_record.type, v_token_record.email,
    v_token_record.user_id, v_token_record.organization_id, v_token_record.role,
    TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 토큰 사용 처리 함수
CREATE OR REPLACE FUNCTION mark_token_used(p_token VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth_tokens
  SET
    is_used = TRUE,
    used_at = NOW(),
    updated_at = NOW()
  WHERE token = p_token
  AND is_used = FALSE
  AND expires_at > NOW();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
