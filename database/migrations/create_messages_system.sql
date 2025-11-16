-- =====================================================
-- 메시지 시스템 테이블 생성
-- 1:1 문의 및 회원 간 메시지 기능
-- =====================================================

-- 1. 메시지 대화방 (스레드)
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 참여자 (2명만 - 1:1 대화)
  participant_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 대화 타입
  thread_type TEXT NOT NULL DEFAULT 'user_to_user', -- 'user_to_user', 'user_to_admin'

  -- 마지막 메시지 정보 (목록에서 빠르게 표시하기 위함)
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 생성/수정 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건: 같은 두 사람 간 중복 대화방 방지
  CONSTRAINT unique_participants UNIQUE (participant_1, participant_2),
  CONSTRAINT different_participants CHECK (participant_1 != participant_2)
);

-- 2. 메시지
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,

  -- 발신자
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 메시지 내용
  content TEXT NOT NULL,

  -- 읽음 여부
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- 생성 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 인덱스용
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_message_threads_participant_1 ON message_threads(participant_1);
CREATE INDEX IF NOT EXISTS idx_message_threads_participant_2 ON message_threads(participant_2);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message_at ON message_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;

-- 4. RLS (Row Level Security) 정책
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- message_threads: 참여자만 조회 가능
DROP POLICY IF EXISTS "Users can view their own threads" ON message_threads;
CREATE POLICY "Users can view their own threads" ON message_threads
  FOR SELECT
  USING (
    auth.uid() = participant_1 OR
    auth.uid() = participant_2
  );

-- message_threads: 누구나 대화방 생성 가능
DROP POLICY IF EXISTS "Users can create threads" ON message_threads;
CREATE POLICY "Users can create threads" ON message_threads
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant_1 OR
    auth.uid() = participant_2
  );

-- message_threads: 참여자만 업데이트 가능
DROP POLICY IF EXISTS "Users can update their own threads" ON message_threads;
CREATE POLICY "Users can update their own threads" ON message_threads
  FOR UPDATE
  USING (
    auth.uid() = participant_1 OR
    auth.uid() = participant_2
  );

-- messages: 대화방 참여자만 메시지 조회 가능
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
CREATE POLICY "Users can view messages in their threads" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (
        message_threads.participant_1 = auth.uid() OR
        message_threads.participant_2 = auth.uid()
      )
    )
  );

-- messages: 대화방 참여자만 메시지 작성 가능
DROP POLICY IF EXISTS "Users can send messages in their threads" ON messages;
CREATE POLICY "Users can send messages in their threads" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (
        message_threads.participant_1 = auth.uid() OR
        message_threads.participant_2 = auth.uid()
      )
    )
  );

-- messages: 읽음 처리 (자신에게 온 메시지만)
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
CREATE POLICY "Users can mark messages as read" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (
        message_threads.participant_1 = auth.uid() OR
        message_threads.participant_2 = auth.uid()
      )
    )
  );

-- 5. 트리거: 새 메시지 작성 시 스레드 업데이트
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET
    last_message_content = NEW.content,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_last_message ON messages;
CREATE TRIGGER trigger_update_thread_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- 6. 헬퍼 함수: 대화방 찾기 또는 생성
CREATE OR REPLACE FUNCTION get_or_create_thread(
  p_user1_id UUID,
  p_user2_id UUID,
  p_thread_type TEXT DEFAULT 'user_to_user'
)
RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
  v_participant_1 UUID;
  v_participant_2 UUID;
BEGIN
  -- 항상 작은 UUID를 participant_1로 (중복 방지)
  IF p_user1_id < p_user2_id THEN
    v_participant_1 := p_user1_id;
    v_participant_2 := p_user2_id;
  ELSE
    v_participant_1 := p_user2_id;
    v_participant_2 := p_user1_id;
  END IF;

  -- 기존 대화방 찾기
  SELECT id INTO v_thread_id
  FROM message_threads
  WHERE participant_1 = v_participant_1
    AND participant_2 = v_participant_2;

  -- 없으면 생성
  IF v_thread_id IS NULL THEN
    INSERT INTO message_threads (participant_1, participant_2, thread_type)
    VALUES (v_participant_1, v_participant_2, p_thread_type)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql;

-- 완료
COMMENT ON TABLE message_threads IS '1:1 메시지 대화방';
COMMENT ON TABLE messages IS '메시지 내용';
