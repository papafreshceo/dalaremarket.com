-- 팝업 관리 테이블 생성
CREATE TABLE IF NOT EXISTS popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 팝업 기본 정보
  title TEXT NOT NULL, -- 팝업 제목
  content TEXT, -- 팝업 내용 (HTML 가능)

  -- Cloudinary 이미지 연결
  image_id UUID REFERENCES cloudinary_images(id) ON DELETE SET NULL,

  -- 팝업 설정
  popup_type TEXT DEFAULT 'notice', -- notice(공지), promotion(프로모션), event(이벤트)
  link_url TEXT, -- 클릭시 이동할 URL

  -- 노출 설정
  is_active BOOLEAN DEFAULT true, -- 활성화 여부
  display_order INTEGER DEFAULT 0, -- 표시 순서 (낮을수록 먼저)

  -- 팝업 크기 및 위치
  width INTEGER DEFAULT 400, -- 팝업 너비 (px)
  height INTEGER DEFAULT 500, -- 팝업 높이 (px)
  position_x INTEGER DEFAULT 100, -- X 좌표
  position_y INTEGER DEFAULT 100, -- Y 좌표

  -- 노출 기간
  start_date TIMESTAMPTZ, -- 시작일시
  end_date TIMESTAMPTZ, -- 종료일시

  -- "오늘 하루 보지 않기" 기능
  enable_today_close BOOLEAN DEFAULT true, -- 오늘하루보지않기 버튼 표시 여부

  -- 메타 정보
  created_by UUID REFERENCES auth.users(id), -- 생성자
  updated_by UUID REFERENCES auth.users(id), -- 수정자
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_popups_is_active ON popups(is_active);
CREATE INDEX IF NOT EXISTS idx_popups_popup_type ON popups(popup_type);
CREATE INDEX IF NOT EXISTS idx_popups_display_order ON popups(display_order);
CREATE INDEX IF NOT EXISTS idx_popups_dates ON popups(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_popups_created_at ON popups(created_at DESC);

-- RLS 비활성화 (관리자 전용 테이블)
ALTER TABLE popups DISABLE ROW LEVEL SECURITY;

-- 테이블 설명
COMMENT ON TABLE popups IS '플랫폼 팝업 공지사항 관리';
COMMENT ON COLUMN popups.popup_type IS '팝업 유형 (notice: 공지, promotion: 프로모션, event: 이벤트)';
COMMENT ON COLUMN popups.enable_today_close IS '오늘 하루 보지 않기 버튼 표시 여부';
COMMENT ON COLUMN popups.image_id IS 'Cloudinary 이미지 ID (cloudinary_images 테이블 참조)';
