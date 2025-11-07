-- Add is_popup column to announcements table
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS is_popup BOOLEAN DEFAULT FALSE;

-- Create index for popup announcements
CREATE INDEX IF NOT EXISTS idx_announcements_is_popup ON announcements(is_popup) WHERE is_popup = TRUE;

COMMENT ON COLUMN announcements.is_popup IS '팝업으로 표시할지 여부';
