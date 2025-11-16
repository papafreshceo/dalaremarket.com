-- Add foreign key constraints for messages table
-- This allows PostgREST to resolve relationships when using embedded select syntax

-- Add foreign key for sender_id -> users.id
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Add foreign key for thread_id -> message_threads.id (if not exists)
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_thread_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_thread_id_fkey
FOREIGN KEY (thread_id)
REFERENCES message_threads(id)
ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Add foreign keys for message_threads table participants
ALTER TABLE message_threads
DROP CONSTRAINT IF EXISTS message_threads_participant_1_fkey;

ALTER TABLE message_threads
ADD CONSTRAINT message_threads_participant_1_fkey
FOREIGN KEY (participant_1)
REFERENCES users(id)
ON DELETE CASCADE;

ALTER TABLE message_threads
DROP CONSTRAINT IF EXISTS message_threads_participant_2_fkey;

ALTER TABLE message_threads
ADD CONSTRAINT message_threads_participant_2_fkey
FOREIGN KEY (participant_2)
REFERENCES users(id)
ON DELETE CASCADE;

-- Add indexes for message_threads
CREATE INDEX IF NOT EXISTS idx_message_threads_participant_1 ON message_threads(participant_1);
CREATE INDEX IF NOT EXISTS idx_message_threads_participant_2 ON message_threads(participant_2);
CREATE INDEX IF NOT EXISTS idx_message_threads_updated_at ON message_threads(updated_at);
