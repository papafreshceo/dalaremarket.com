-- Player ID 저장 확인

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
WHERE op.user_id = '40861fd6-7faf-4b40-9cbc-c3f54a144f2e'
ORDER BY op.updated_at DESC;
