-- Supabase Realtime 활성화 설정
-- messages, message_threads, notifications 테이블에 대한 Realtime 구독 활성화

-- 1. messages 테이블 Realtime 활성화 (이미 있으면 스킵)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'messages 테이블은 이미 Realtime이 활성화되어 있습니다.';
  END;
END $$;

-- 2. message_threads 테이블 Realtime 활성화 (이미 있으면 스킵)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'message_threads 테이블은 이미 Realtime이 활성화되어 있습니다.';
  END;
END $$;

-- 3. notifications 테이블 Realtime 활성화 (이미 있으면 스킵)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'notifications 테이블은 이미 Realtime이 활성화되어 있습니다.';
  END;
END $$;

-- 확인: 현재 Realtime이 활성화된 테이블 목록 조회
SELECT
  schemaname,
  tablename
FROM
  pg_publication_tables
WHERE
  pubname = 'supabase_realtime'
ORDER BY
  tablename;
