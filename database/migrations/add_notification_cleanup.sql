-- =====================================================
-- 알림 자동 정리 (30일 보관)
-- =====================================================
-- 작성일: 2025-01-16
-- 설명: 30일이 지난 알림을 자동으로 삭제하는 함수 및 스케줄
-- =====================================================

-- 1. 30일 지난 알림 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 30일 이상 지난 알림 삭제
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- 로그 기록
  RAISE NOTICE '30일 지난 알림 % 개 삭제됨', deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_notifications() IS '30일이 지난 알림을 삭제하는 정리 함수';

-- 2. pg_cron 확장 설치 (이미 설치되어 있으면 무시됨)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. 매일 새벽 3시에 자동 실행 스케줄 설정
-- Supabase에서는 pg_cron을 직접 사용할 수 없으므로 주석 처리
-- SELECT cron.schedule(
--   'cleanup-old-notifications',
--   '0 3 * * *',  -- 매일 새벽 3시
--   'SELECT cleanup_old_notifications();'
-- );

-- =====================================================
-- 수동 실행 방법:
-- SELECT cleanup_old_notifications();
-- =====================================================

-- =====================================================
-- 대안: API 엔드포인트에서 호출
-- GET /api/admin/cleanup-notifications
-- =====================================================
