import { NextResponse } from 'next/server';

/**
 * GET /api/run-migration
 * Cloudinary 이미지 테이블 마이그레이션 실행
 *
 * Supabase SQL Editor에서 직접 실행하세요:
 * https://supabase.com/dashboard/project/ketdnqhxwqcgyltinjih/sql/new
 */
export async function GET() {
  const migrationSQL = `
-- Cloudinary 이미지 메타데이터 저장 테이블
CREATE TABLE IF NOT EXISTS cloudinary_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloudinary_id TEXT NOT NULL UNIQUE,
  cloudinary_url TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  format TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  category TEXT DEFAULT '기타',
  title TEXT,
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  is_downloadable BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cloudinary_images_category ON cloudinary_images(category);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_is_public ON cloudinary_images(is_public);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_tags ON cloudinary_images USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_created_at ON cloudinary_images(created_at DESC);

ALTER TABLE cloudinary_images DISABLE ROW LEVEL SECURITY;

-- 카테고리 목록 테이블
CREATE TABLE IF NOT EXISTS image_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO image_categories (name, description, icon, display_order) VALUES
  ('상품이미지', '상품 관련 이미지', '📦', 1),
  ('배너', '홈페이지 배너', '🎨', 2),
  ('프로모션', '프로모션/이벤트 이미지', '🎉', 3),
  ('로고', '로고 및 브랜드 이미지', '🏷️', 4),
  ('기타', '기타 이미지', '📁', 5)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE image_categories DISABLE ROW LEVEL SECURITY;

-- 다운로드 로그 테이블
CREATE TABLE IF NOT EXISTS image_download_logs (
  id BIGSERIAL PRIMARY KEY,
  image_id UUID REFERENCES cloudinary_images(id) ON DELETE CASCADE,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_logs_image_id ON image_download_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON image_download_logs(downloaded_at DESC);

ALTER TABLE image_download_logs DISABLE ROW LEVEL SECURITY;
`;

  return NextResponse.json({
    success: true,
    message: 'Supabase SQL Editor에서 아래 SQL을 실행하세요',
    sql: migrationSQL,
    link: 'https://supabase.com/dashboard/project/ketdnqhxwqcgyltinjih/sql/new'
  });
}
