-- =====================================================
-- 이메일 시스템 (Resend + React Email)
-- =====================================================
-- 작성일: 2025-01-16
-- 설명:
--   농산물 B2B 플랫폼 이메일 발송 시스템
--   Resend를 통한 트랜잭션/마케팅 이메일 발송
-- =====================================================

-- =====================================================
-- 1. users 테이블에 이메일 관련 컬럼 추가
-- =====================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE;

-- unsubscribe_token 인덱스
CREATE INDEX IF NOT EXISTS idx_users_unsubscribe_token ON users(unsubscribe_token);

-- 기존 사용자에게 unsubscribe_token 생성 (NULL인 경우에만)
UPDATE users
SET unsubscribe_token = gen_random_uuid()::text
WHERE unsubscribe_token IS NULL;

-- =====================================================
-- 2. email_templates 테이블 (이메일 템플릿 관리)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 템플릿 기본 정보
  name TEXT NOT NULL,                          -- '회원가입 인증', '비밀번호 재설정', '출하 소식'
  type TEXT NOT NULL CHECK (type IN ('transactional', 'marketing', 'notification', 'broadcast')),

  -- 이메일 내용
  subject TEXT NOT NULL,                       -- 이메일 제목 (변수 지원: {name}, {date})
  html_content TEXT NOT NULL,                  -- HTML 템플릿
  text_content TEXT,                           -- 플레인 텍스트 버전 (선택)

  -- 메타데이터
  variables JSONB DEFAULT '{}',                -- 사용 가능한 변수 목록 {"name": "사용자명", "date": "날짜"}
  description TEXT,                            -- 템플릿 설명

  -- 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 생성/수정 정보
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

-- =====================================================
-- 3. email_logs 테이블 (이메일 발송 기록)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 이메일 타입 및 수신자
  email_type TEXT NOT NULL,                    -- 'signup_verification', 'password_reset', 'harvest_notice'
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- 이메일 내용
  subject TEXT,
  html_content TEXT,

  -- 발송 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),

  -- Resend API 응답
  resend_id TEXT,                              -- Resend에서 반환한 이메일 ID
  error_message TEXT,

  -- 메타데이터
  metadata JSONB,                              -- 추가 데이터 (주문번호, 사용자 ID 등)

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id);

-- =====================================================
-- 4. email_broadcasts 테이블 (전체 이메일 발송 기록)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 발송 정보
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,

  -- 발송자
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 통계
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,

  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed')),

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_sent_by ON email_broadcasts(sent_by);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_created_at ON email_broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_status ON email_broadcasts(status);

-- =====================================================
-- 5. email_unsubscribes 테이블 (구독 취소 기록)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- 구독 취소 정보
  unsubscribe_type TEXT NOT NULL,              -- 'all', 'marketing', 'notification'
  reason TEXT,

  -- 타임스탬프
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_user_id ON email_unsubscribes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);

-- =====================================================
-- 6. RLS(Row Level Security) 정책
-- =====================================================

-- email_templates RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- email_logs RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can manage email logs"
  ON email_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- email_broadcasts RLS
ALTER TABLE email_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email broadcasts"
  ON email_broadcasts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- email_unsubscribes RLS
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own unsubscribes"
  ON email_unsubscribes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage unsubscribes"
  ON email_unsubscribes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 7. 트리거 함수 (updated_at 자동 갱신)
-- =====================================================

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- =====================================================
-- 8. 기본 이메일 템플릿 생성
-- =====================================================

INSERT INTO email_templates (name, type, subject, html_content, variables, description, is_active)
VALUES
  (
    '전체 공지',
    'broadcast',
    '{subject}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: white; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>달래마켓</h1>
    </div>
    <div class="content">
      <h2>{title}</h2>
      <p>{content}</p>
    </div>
    <div class="footer">
      <p>이 이메일을 더 이상 받고 싶지 않으시면 <a href="{unsubscribe_url}">구독 취소</a>를 클릭하세요.</p>
      <p>&copy; 2025 달래마켓. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
    '{"subject": "제목", "title": "타이틀", "content": "내용", "unsubscribe_url": "구독취소URL"}',
    '관리자가 전체 사용자에게 발송하는 공지 이메일',
    true
  )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE email_templates IS '이메일 템플릿 관리';
COMMENT ON TABLE email_logs IS '이메일 발송 기록 (Resend)';
COMMENT ON TABLE email_broadcasts IS '전체 이메일 발송 기록';
COMMENT ON TABLE email_unsubscribes IS '이메일 구독 취소 기록';
