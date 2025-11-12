-- 알림 시스템 테이블 생성
-- 셀러계정 초대 및 기타 알림을 관리하는 테이블

-- 1. notifications 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. organization_invitations 테이블에 notification_id 컬럼 추가
ALTER TABLE organization_invitations
  ADD COLUMN IF NOT EXISTS notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL;

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- 5. 알림 타입 설명 (주석)
COMMENT ON COLUMN notifications.type IS '알림 타입: organization_invitation, order_update, system_notice 등';
COMMENT ON COLUMN notifications.data IS 'JSONB 형식의 추가 데이터 (invitation_id, organization_id 등)';
COMMENT ON COLUMN notifications.read IS '읽음 여부';
COMMENT ON COLUMN notifications.read_at IS '읽은 시각';
