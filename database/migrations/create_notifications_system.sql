-- =====================================================
-- 푸시 알림 시스템 (OneSignal + PWA)
-- =====================================================
-- 작성일: 2025-01-16
-- 설명:
--   농산물 B2B 플랫폼 푸시 알림 시스템
--   OneSignal을 통한 PC + Android + iOS 통합 알림
-- =====================================================

-- 기존 notifications 테이블이 있다면 삭제 (주의: 기존 데이터 손실)
-- DROP TABLE IF EXISTS notifications CASCADE;

-- =====================================================
-- 1. notifications 테이블 (알림 기록)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🎯 수신자
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL이면 전체 발송
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- 📝 알림 타입 및 내용
  type TEXT NOT NULL,                      -- 'order_status', 'announcement', 'comment_reply', 'deposit_confirm', 'admin_new_order', 'admin_support_post', 'admin_new_member'
  category TEXT,                           -- 'seller', 'admin' (누구를 위한 알림인지)
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- 🔗 관련 리소스
  resource_type TEXT,                      -- 'order', 'announcement', 'post', 'comment', 'deposit', 'user'
  resource_id TEXT,

  -- 🌐 액션 URL (클릭 시 이동)
  action_url TEXT,

  -- 📊 추가 데이터
  data JSONB,                              -- { "order_number": "2025011601", "status": "confirmed" }

  -- 👤 발송자
  sent_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- ✅ 상태
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- OneSignal 발송 정보
  onesignal_notification_id TEXT,          -- OneSignal에서 받은 notification ID
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  send_error TEXT,

  -- ⚡ 우선순위
  priority TEXT DEFAULT 'normal',          -- 'low', 'normal', 'high'

  -- ⏰ 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. notification_settings 테이블 (사용자별 알림 설정)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- 🔔 전체 알림 on/off
  push_enabled BOOLEAN DEFAULT TRUE,

  -- 📢 셀러 알림 설정
  order_status_enabled BOOLEAN DEFAULT TRUE,           -- 발주서 상태 변경
  announcements_enabled BOOLEAN DEFAULT TRUE,          -- 공지사항 (발송휴무일, 출하소식, 가격, 품절)
  comment_reply_enabled BOOLEAN DEFAULT TRUE,          -- 댓글 답글
  deposit_confirm_enabled BOOLEAN DEFAULT TRUE,        -- 예치금 입금 확인
  marketing_enabled BOOLEAN DEFAULT FALSE,             -- 마케팅 알림

  -- 🌙 방해 금지 시간
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,                              -- 예: '22:00'
  quiet_hours_end TIME,                                -- 예: '08:00'

  -- ⏰ 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. admin_notification_settings 테이블 (관리자 알림 설정)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- 🔔 전체 알림 on/off
  push_enabled BOOLEAN DEFAULT TRUE,

  -- 📋 관리자 알림 세부 설정
  new_order_enabled BOOLEAN DEFAULT TRUE,              -- 신규 발주서 등록
  support_post_enabled BOOLEAN DEFAULT TRUE,           -- 질문/건의 게시글
  new_member_enabled BOOLEAN DEFAULT TRUE,             -- 신규 회원 가입

  -- 추가 액션별 설정 (필요 시 컬럼 추가)
  order_cancel_enabled BOOLEAN DEFAULT TRUE,           -- 발주서 취소 요청
  payment_issue_enabled BOOLEAN DEFAULT TRUE,          -- 결제 오류

  -- 🌙 방해 금지 시간
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- ⏰ 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. onesignal_player_ids 테이블 (사용자-디바이스 매핑)
-- =====================================================
-- OneSignal Player ID = 디바이스 고유 ID
-- 한 사용자가 여러 디바이스를 가질 수 있음 (PC, Android, iOS)
CREATE TABLE IF NOT EXISTS onesignal_player_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  player_id TEXT NOT NULL UNIQUE,          -- OneSignal Player ID
  device_type TEXT,                        -- 'web', 'android', 'ios'
  device_model TEXT,                       -- 'Chrome', 'Samsung Galaxy', 'iPhone 15'

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

-- =====================================================
-- 5. 인덱스 생성
-- =====================================================

-- notifications 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- notification_settings 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- admin_notification_settings 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_notification_settings_user_id ON admin_notification_settings(user_id);

-- onesignal_player_ids 인덱스
CREATE INDEX IF NOT EXISTS idx_onesignal_player_ids_user_id ON onesignal_player_ids(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_player_ids_player_id ON onesignal_player_ids(player_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_player_ids_active ON onesignal_player_ids(is_active);

-- =====================================================
-- 6. RLS(Row Level Security) 정책
-- =====================================================

-- notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신에게 온 알림만 조회
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    auth.uid() = user_id OR
    user_id IS NULL  -- 전체 공지
  );

-- 사용자는 자신의 알림만 업데이트 (읽음 처리)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 시스템/관리자는 알림 생성 가능
CREATE POLICY "Service role can manage notifications"
  ON notifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- notification_settings RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE admin_notification_settings ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE onesignal_player_ids ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- 7. 트리거 함수 (updated_at 자동 갱신)
-- =====================================================

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_admin_notification_settings_updated_at
  BEFORE UPDATE ON admin_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_onesignal_player_ids_updated_at
  BEFORE UPDATE ON onesignal_player_ids
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- =====================================================
-- 8. 뷰(View) - 읽지 않은 알림 수
-- =====================================================

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

-- =====================================================
-- 9. 헬퍼 함수 - 신규 사용자 알림 설정 자동 생성
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 새 사용자 생성 시 자동 설정 생성
CREATE TRIGGER trigger_create_default_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

COMMENT ON TABLE notifications IS '알림 기록 (OneSignal 통합)';
COMMENT ON TABLE notification_settings IS '사용자별 알림 수신 설정 (셀러용)';
COMMENT ON TABLE admin_notification_settings IS '관리자 알림 수신 설정';
COMMENT ON TABLE onesignal_player_ids IS 'OneSignal Player ID 매핑 (사용자-디바이스)';
