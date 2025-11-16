-- Player ID 불일치 확인

-- =====================================================
-- 1. 현재 저장된 모든 Player ID 조회
-- =====================================================

SELECT
  op.id,
  op.user_id,
  op.player_id,
  op.is_active,
  op.created_at,
  op.updated_at,
  u.email,
  u.profile_name
FROM onesignal_player_ids op
LEFT JOIN users u ON u.id = op.user_id
ORDER BY op.updated_at DESC;

-- =====================================================
-- 2. 특정 사용자의 Player ID 조회
-- =====================================================

SELECT
  op.player_id,
  op.is_active,
  op.created_at,
  op.updated_at
FROM onesignal_player_ids op
WHERE op.user_id = '40861fd6-7faf-4b40-9cbc-c3f54a144f2e'
ORDER BY op.updated_at DESC;

-- =====================================================
-- 3. 잘못된 Player ID 삭제 (invalid_player_ids에 있던 것)
-- =====================================================

DELETE FROM onesignal_player_ids
WHERE player_id = '7700f7b8-f8e6-41b3-92e5-ebe2066f4eb4';

-- 결과 확인
SELECT COUNT(*) as deleted_count FROM onesignal_player_ids WHERE player_id = '7700f7b8-f8e6-41b3-92e5-ebe2066f4eb4';
