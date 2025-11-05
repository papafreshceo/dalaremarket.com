-- 관리자 닉네임 테이블
CREATE TABLE IF NOT EXISTS admin_nicknames (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_nicknames_active ON admin_nicknames(is_active);

-- 코멘트
COMMENT ON TABLE admin_nicknames IS '관리자용 닉네임 목록';
COMMENT ON COLUMN admin_nicknames.nickname IS '관리자 닉네임 (중복 불가)';
COMMENT ON COLUMN admin_nicknames.description IS '닉네임 설명';
COMMENT ON COLUMN admin_nicknames.is_active IS '사용 가능 여부';

-- 샘플 데이터
INSERT INTO admin_nicknames (nickname, description) VALUES
('달래마켓', '공식 계정'),
('고객센터', '고객 지원 계정'),
('운영자', '운영팀 계정'),
('공지', '공지사항 전용'),
('이벤트팀', '이벤트 담당')
ON CONFLICT (nickname) DO NOTHING;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_admin_nicknames_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_nicknames_updated_at
  BEFORE UPDATE ON admin_nicknames
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_nicknames_updated_at();
