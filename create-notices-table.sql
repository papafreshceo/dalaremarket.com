-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS platform_notices (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- general(일반), important(중요), update(업데이트), event(이벤트)
  is_pinned BOOLEAN NOT NULL DEFAULT false, -- 상단 고정 여부
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id),
  published BOOLEAN NOT NULL DEFAULT true
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_platform_notices_created_at ON platform_notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_notices_category ON platform_notices(category);
CREATE INDEX IF NOT EXISTS idx_platform_notices_is_pinned ON platform_notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_platform_notices_published ON platform_notices(published);

-- RLS 정책 설정
ALTER TABLE platform_notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개된 공지사항을 읽을 수 있음
CREATE POLICY "Anyone can view published notices" ON platform_notices
  FOR SELECT USING (published = true);

-- 관리자만 공지사항을 생성/수정/삭제할 수 있음 (나중에 구현 시)
-- CREATE POLICY "Admins can manage notices" ON platform_notices
--   FOR ALL USING (
--     auth.uid() IN (
--       SELECT id FROM users WHERE role IN ('admin', 'super_admin')
--     )
--   );

-- 샘플 데이터 삽입
INSERT INTO platform_notices (title, content, category, is_pinned) VALUES
('달래마켓 플랫폼 오픈 안내', '안녕하세요, 농산물 셀러 여러분!

달래마켓 플랫폼이 정식으로 오픈되었습니다.

## 주요 기능
- 주문 통합 관리
- 상품 조회 및 관리
- 실시간 배송 추적
- 정산 내역 확인

앞으로 농산물 유통이 더욱 편리해집니다. 많은 이용 부탁드립니다!', 'important', true),

('2025년 1월 주문 마감 일정 안내', '1월 주문 마감 일정을 안내드립니다.

**설 연휴 기간 특별 운영 안내**

- 1월 27일(월) ~ 1월 30일(목): 정상 운영
- 1월 31일(금) ~ 2월 2일(일): 설 연휴 휴무
- 2월 3일(월)부터: 정상 운영

설 연휴 기간에는 주문 접수 및 배송이 중단되오니 참고 부탁드립니다.', 'general', false),

('신규 상품 등록 및 시세 정보 업데이트', '안녕하세요!

이번 주 신규 상품이 추가되었으며, 시세 정보가 업데이트되었습니다.

**신규 등록 상품**
- 유기농 방울토마토 (경북 예천)
- 샤인머스캣 (경북 상주)
- 무농약 시금치 (충남 당진)

**시세 변동 안내**
- 배추: 전주 대비 +6.3%
- 사과: 전주 대비 -3.0%
- 대파: 전주 대비 +6.7%

상품 페이지에서 확인하실 수 있습니다.', 'update', false),

('배송 시스템 개선 안내', '배송 시스템이 개선되었습니다.

**개선 내용**
1. 실시간 배송 조회 기능 추가
2. 송장 번호 자동 등록 기능
3. 배송 상태 알림 기능

이제 더욱 편리하게 배송을 관리하실 수 있습니다!', 'update', false),

('2월 Win-Win 프로그램 안내', '2월 Win-Win 프로그램을 안내드립니다.

**이달의 혜택**
- 신규 판로 개척 지원
- 물류비 10% 할인
- 마케팅 자료 무료 제공

자세한 내용은 Win-Win 페이지에서 확인하실 수 있습니다.', 'event', false);

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_platform_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_notices_updated_at
  BEFORE UPDATE ON platform_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_notices_updated_at();
