-- Cloudinary 이미지 메타데이터 저장 테이블
CREATE TABLE IF NOT EXISTS cloudinary_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cloudinary 정보
  cloudinary_id TEXT NOT NULL UNIQUE, -- Cloudinary public_id
  cloudinary_url TEXT NOT NULL, -- 원본 URL
  secure_url TEXT NOT NULL, -- HTTPS URL

  -- 이미지 기본 정보
  filename TEXT NOT NULL,
  format TEXT, -- jpg, png, webp 등
  width INTEGER,
  height INTEGER,
  file_size INTEGER, -- bytes

  -- 분류 및 메타데이터
  category TEXT DEFAULT '기타', -- 카테고리 (상품이미지, 배너, 프로모션 등)
  title TEXT, -- 이미지 제목
  description TEXT, -- 설명
  tags TEXT[], -- 태그 배열

  -- 공개 설정
  is_public BOOLEAN DEFAULT true, -- 공개 여부
  is_downloadable BOOLEAN DEFAULT true, -- 다운로드 가능 여부

  -- 통계
  view_count INTEGER DEFAULT 0, -- 조회 수
  download_count INTEGER DEFAULT 0, -- 다운로드 수

  -- 메타 정보
  uploaded_by UUID REFERENCES auth.users(id), -- 업로드한 사용자
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_category ON cloudinary_images(category);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_is_public ON cloudinary_images(is_public);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_tags ON cloudinary_images USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_created_at ON cloudinary_images(created_at DESC);

-- RLS 비활성화 (관리자 전용 테이블)
ALTER TABLE cloudinary_images DISABLE ROW LEVEL SECURITY;

-- 카테고리 목록 테이블
CREATE TABLE IF NOT EXISTS image_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- 아이콘 이름
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 카테고리 추가
INSERT INTO image_categories (name, description, icon, display_order) VALUES
  ('상품이미지', '상품 관련 이미지', '📦', 1),
  ('배너', '홈페이지 배너', '🎨', 2),
  ('프로모션', '프로모션/이벤트 이미지', '🎉', 3),
  ('로고', '로고 및 브랜드 이미지', '🏷️', 4),
  ('기타', '기타 이미지', '📁', 5)
ON CONFLICT (name) DO NOTHING;

-- RLS 비활성화
ALTER TABLE image_categories DISABLE ROW LEVEL SECURITY;

-- 다운로드 로그 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS image_download_logs (
  id BIGSERIAL PRIMARY KEY,
  image_id UUID REFERENCES cloudinary_images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- 로그인한 경우
  ip_address TEXT, -- IP 추적
  user_agent TEXT, -- 브라우저 정보
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_logs_image_id ON image_download_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON image_download_logs(downloaded_at DESC);

ALTER TABLE image_download_logs DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE cloudinary_images IS 'Cloudinary에 업로드된 이미지의 메타데이터 저장';
COMMENT ON TABLE image_categories IS '이미지 카테고리 관리';
COMMENT ON TABLE image_download_logs IS '이미지 다운로드 로그 (통계용)';
