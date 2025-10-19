-- YouTube 영상 정보 테이블 생성
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  thumbnail_high_url TEXT,
  published_at TIMESTAMPTZ,
  channel_id TEXT,
  channel_title TEXT,
  duration TEXT,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON youtube_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel_id ON youtube_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_is_active ON youtube_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at ON youtube_videos(published_at DESC);

-- 주석 추가
COMMENT ON TABLE youtube_videos IS 'YouTube 채널 영상 정보';
COMMENT ON COLUMN youtube_videos.video_id IS 'YouTube 영상 ID';
COMMENT ON COLUMN youtube_videos.thumbnail_url IS '기본 썸네일 URL';
COMMENT ON COLUMN youtube_videos.thumbnail_high_url IS '고화질 썸네일 URL';
COMMENT ON COLUMN youtube_videos.duration IS '영상 길이 (ISO 8601 형식)';
COMMENT ON COLUMN youtube_videos.is_active IS '활성화 여부 (관리용)';
