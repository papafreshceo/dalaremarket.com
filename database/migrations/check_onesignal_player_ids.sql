-- OneSignal Player ID 등록 확인

-- =====================================================
-- 1. onesignal_player_ids 테이블 존재 확인
-- =====================================================

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'onesignal_player_ids';

-- =====================================================
-- 2. onesignal_player_ids 테이블 스키마 확인
-- =====================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'onesignal_player_ids'
ORDER BY ordinal_position;

-- =====================================================
-- 3. 등록된 Player ID 확인
-- =====================================================

SELECT
  op.id,
  op.user_id,
  op.player_id,
  op.is_active,
  op.created_at,
  u.email,
  u.name,
  u.profile_name
FROM onesignal_player_ids op
LEFT JOIN users u ON u.id = op.user_id
ORDER BY op.created_at DESC
LIMIT 10;

-- =====================================================
-- 4. 활성화된 Player ID 개수 확인
-- =====================================================

SELECT
  COUNT(*) as total_players,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_players,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_players
FROM onesignal_player_ids;
