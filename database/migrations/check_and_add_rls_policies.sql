-- RLS 정책 확인 및 추가
-- Realtime은 RLS 정책을 따르므로 SELECT 정책이 필요합니다

-- =====================================================
-- 1. 현재 RLS 정책 확인
-- =====================================================

-- messages 테이블 RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('messages', 'message_threads', 'notifications')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. RLS 활성화 확인
-- =====================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('messages', 'message_threads', 'notifications');

-- =====================================================
-- 3. messages 테이블 RLS 정책 추가
-- =====================================================

-- RLS 활성화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 자신이 참여한 대화방의 메시지만 조회 가능
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
CREATE POLICY "Users can view messages in their threads"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.id = messages.thread_id
    AND (message_threads.participant_1 = auth.uid() OR message_threads.participant_2 = auth.uid())
  )
);

-- INSERT 정책: 자신이 발신자인 메시지만 생성 가능
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- UPDATE 정책: 읽음 표시 업데이트만 가능 (받는 사람만)
DROP POLICY IF EXISTS "Users can update read status of received messages" ON messages;
CREATE POLICY "Users can update read status of received messages"
ON messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.id = messages.thread_id
    AND (
      (message_threads.participant_1 = auth.uid() AND messages.sender_id = message_threads.participant_2)
      OR
      (message_threads.participant_2 = auth.uid() AND messages.sender_id = message_threads.participant_1)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.id = messages.thread_id
    AND (
      (message_threads.participant_1 = auth.uid() AND messages.sender_id = message_threads.participant_2)
      OR
      (message_threads.participant_2 = auth.uid() AND messages.sender_id = message_threads.participant_1)
    )
  )
);

-- =====================================================
-- 4. message_threads 테이블 RLS 정책 추가
-- =====================================================

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 자신이 참여한 대화방만 조회 가능
DROP POLICY IF EXISTS "Users can view their own threads" ON message_threads;
CREATE POLICY "Users can view their own threads"
ON message_threads FOR SELECT
TO authenticated
USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- INSERT 정책: 자신이 참여하는 대화방만 생성 가능
DROP POLICY IF EXISTS "Users can create threads they participate in" ON message_threads;
CREATE POLICY "Users can create threads they participate in"
ON message_threads FOR INSERT
TO authenticated
WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- UPDATE 정책: 자신이 참여한 대화방만 업데이트 가능
DROP POLICY IF EXISTS "Users can update their own threads" ON message_threads;
CREATE POLICY "Users can update their own threads"
ON message_threads FOR UPDATE
TO authenticated
USING (participant_1 = auth.uid() OR participant_2 = auth.uid())
WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- =====================================================
-- 5. notifications 테이블 RLS 정책 추가
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 자신의 알림만 조회 가능
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT 정책: 시스템만 알림 생성 가능 (service_role)
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- UPDATE 정책: 자신의 알림만 업데이트 가능 (읽음 표시)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. 최종 확인
-- =====================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('messages', 'message_threads', 'notifications')
ORDER BY tablename, policyname;
