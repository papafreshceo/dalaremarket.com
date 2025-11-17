-- Enable Realtime for messaging tables
-- This ensures that messages, message_threads, and notifications are published via Realtime

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;

-- Verify the publication (for documentation purposes)
-- To check if tables are in publication, run:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
