-- 관리자 초대 테이블 생성
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin', 'super_admin')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_used ON invitations(used);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- RLS 활성화
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (관리자만 접근 가능)
CREATE POLICY "관리자만 초대 조회 가능"
  ON invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'employee')
    )
  );

CREATE POLICY "관리자만 초대 생성 가능"
  ON invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "관리자만 초대 수정 가능"
  ON invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'employee')
    )
  );
