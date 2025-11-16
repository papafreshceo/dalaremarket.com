-- 전체 공지 발송 기록 테이블
CREATE TABLE IF NOT EXISTS notification_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'broadcast',
  url TEXT,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 0,
  onesignal_notification_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_broadcasts_sent_by ON notification_broadcasts(sent_by);
CREATE INDEX IF NOT EXISTS idx_notification_broadcasts_created_at ON notification_broadcasts(created_at DESC);

-- RLS 정책
ALTER TABLE notification_broadcasts ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admins can view broadcasts"
ON notification_broadcasts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 관리자만 삽입 가능
CREATE POLICY "Admins can insert broadcasts"
ON notification_broadcasts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);
