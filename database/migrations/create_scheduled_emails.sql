-- 예약 이메일 테이블 생성

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id BIGSERIAL PRIMARY KEY,

  -- 발송 정보
  template_id BIGINT REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_emails TEXT[] NOT NULL, -- 수신자 이메일 배열
  variables JSONB DEFAULT '{}', -- 변수 값들

  -- 예약 정보
  scheduled_at TIMESTAMPTZ NOT NULL, -- 발송 예정 시간
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, cancelled, failed

  -- 실행 정보
  sent_at TIMESTAMPTZ, -- 실제 발송 시간
  sent_count INT DEFAULT 0, -- 성공 발송 수
  failed_count INT DEFAULT 0, -- 실패 발송 수
  error_message TEXT, -- 에러 메시지

  -- 메타데이터
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'cancelled', 'failed'))
);

-- 인덱스 생성
CREATE INDEX idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
CREATE INDEX idx_scheduled_emails_created_by ON scheduled_emails(created_by);

-- RLS 정책 활성화
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY "관리자만 예약 이메일 조회 가능"
  ON scheduled_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'employee')
    )
  );

CREATE POLICY "관리자만 예약 이메일 생성 가능"
  ON scheduled_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'employee')
    )
  );

CREATE POLICY "관리자만 예약 이메일 수정 가능"
  ON scheduled_emails
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'employee')
    )
  );

CREATE POLICY "관리자만 예약 이메일 삭제 가능"
  ON scheduled_emails
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'employee')
    )
  );
