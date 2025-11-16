-- 최근 생성된 알림 확인

-- =====================================================
-- 1. 최근 10개 알림 조회
-- =====================================================

SELECT
  n.id,
  n.user_id,
  n.type,
  n.category,
  n.title,
  n.body,
  n.is_sent,
  n.sent_at,
  n.onesignal_notification_id,
  n.send_error,
  n.created_at,
  u.email,
  u.profile_name
FROM notifications n
LEFT JOIN users u ON u.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;

-- =====================================================
-- 2. 전송 실패한 알림 조회
-- =====================================================

SELECT
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.is_sent,
  n.send_error,
  n.created_at,
  u.email
FROM notifications n
LEFT JOIN users u ON u.id = n.user_id
WHERE n.is_sent = false OR n.send_error IS NOT NULL
ORDER BY n.created_at DESC
LIMIT 10;

-- =====================================================
-- 3. new_message 타입 알림만 조회
-- =====================================================

SELECT
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.body,
  n.is_sent,
  n.sent_at,
  n.send_error,
  n.created_at,
  u.email
FROM notifications n
LEFT JOIN users u ON u.id = n.user_id
WHERE n.type = 'new_message'
ORDER BY n.created_at DESC
LIMIT 10;
