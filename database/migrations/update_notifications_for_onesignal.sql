-- =====================================================
-- 기존 notifications 테이블을 OneSignal용으로 업데이트
-- =====================================================

-- 1. 기존 notifications 테이블에 새 컬럼 추가
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS resource_id TEXT,
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS sent_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onesignal_notification_id TEXT,
  ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS send_error TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 2. 기존 컬럼 이름 변경 (read -> is_read는 이미 추가됨)
-- data 컬럼이 이미 있으므로 유지
-- message -> body로 변경
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS body TEXT;

-- message 데이터를 body로 복사
UPDATE notifications SET body = message WHERE body IS NULL AND message IS NOT NULL;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- 4. notification_settings 테이블 생성
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- 🔔 전체 알림 on/off
  push_enabled BOOLEAN DEFAULT TRUE,

  -- 📢 셀러 알림 설정
  order_status_enabled BOOLEAN DEFAULT TRUE,
  announcements_enabled BOOLEAN DEFAULT TRUE,
  comment_reply_enabled BOOLEAN DEFAULT TRUE,
  deposit_confirm_enabled BOOLEAN DEFAULT TRUE,
  marketing_enabled BOOLEAN DEFAULT FALSE,

  -- 🌙 방해 금지 시간
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- ⏰ 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. admin_notification_settings 테이블 생성
CREATE TABLE IF NOT EXISTS admin_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- 🔔 전체 알림 on/off
  push_enabled BOOLEAN DEFAULT TRUE,

  -- 📋 관리자 알림 세부 설정
  new_order_enabled BOOLEAN DEFAULT TRUE,
  support_post_enabled BOOLEAN DEFAULT TRUE,
  new_member_enabled BOOLEAN DEFAULT TRUE,
  order_cancel_enabled BOOLEAN DEFAULT TRUE,
  payment_issue_enabled BOOLEAN DEFAULT TRUE,

  -- 🌙 방해 금지 시간
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- ⏰ 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. onesignal_player_ids 테이블 생성
CREATE TABLE IF NOT EXISTS onesignal_player_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  player_id TEXT NOT NULL UNIQUE,
  device_type TEXT,
  device_model TEXT,

  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- 메타데이터
  user_agent TEXT,
  ip_address TEXT,

  -- ⏰ 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_settings_user_id ON admin_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_player_ids_user_id ON onesignal_player_ids(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_player_ids_player_id ON onesignal_player_ids(player_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_player_ids_active ON onesignal_player_ids(is_active);

-- 8. RLS 정책
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_player_ids ENABLE ROW LEVEL SECURITY;

-- notification_settings RLS
CREATE POLICY "Users can view own settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- admin_notification_settings RLS
CREATE POLICY "Admins can view own settings"
  ON admin_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert own settings"
  ON admin_notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update own settings"
  ON admin_notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- onesignal_player_ids RLS
CREATE POLICY "Users can view own player IDs"
  ON onesignal_player_ids FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own player IDs"
  ON onesignal_player_ids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own player IDs"
  ON onesignal_player_ids FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own player IDs"
  ON onesignal_player_ids FOR DELETE
  USING (auth.uid() = user_id);

-- Service role 전체 접근
CREATE POLICY "Service role can manage player IDs"
  ON onesignal_player_ids FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 9. 트리거
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

CREATE TRIGGER trigger_admin_notification_settings_updated_at
  BEFORE UPDATE ON admin_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

CREATE TRIGGER trigger_onesignal_player_ids_updated_at
  BEFORE UPDATE ON onesignal_player_ids
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- 10. 뷰 생성
CREATE OR REPLACE VIEW v_unread_notifications AS
SELECT
  user_id,
  COUNT(*) as unread_count,
  COUNT(*) FILTER (WHERE type = 'order_status') as unread_orders,
  COUNT(*) FILTER (WHERE type = 'announcement') as unread_announcements,
  COUNT(*) FILTER (WHERE type = 'comment_reply') as unread_comments,
  COUNT(*) FILTER (WHERE type = 'deposit_confirm') as unread_deposits
FROM notifications
WHERE is_read = FALSE AND user_id IS NOT NULL
GROUP BY user_id;

COMMENT ON TABLE notification_settings IS '사용자별 알림 수신 설정 (셀러용)';
COMMENT ON TABLE admin_notification_settings IS '관리자 알림 수신 설정';
COMMENT ON TABLE onesignal_player_ids IS 'OneSignal Player ID 매핑 (사용자-디바이스)';
