-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read published announcements
CREATE POLICY "Anyone can read published announcements"
  ON announcements
  FOR SELECT
  USING (published = TRUE);

-- Allow authenticated users to read all announcements (for admin)
CREATE POLICY "Authenticated users can read all announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Allow authenticated users to insert announcements (for admin)
CREATE POLICY "Authenticated users can insert announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Allow authenticated users to update their own announcements
CREATE POLICY "Users can update their own announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow authenticated users to delete their own announcements
CREATE POLICY "Users can delete their own announcements"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Add comment
COMMENT ON TABLE announcements IS '공지사항 테이블';
