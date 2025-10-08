-- ===========================
-- 마켓 매핑 설정 테이블 생성
-- ===========================
-- 각 오픈마켓에서 다운로드한 주문 엑셀 파일의 필드를 표준필드로 매핑하는 설정

DROP TABLE IF EXISTS mapping_settings;

CREATE TABLE mapping_settings (
  id SERIAL PRIMARY KEY,
  market_name VARCHAR(50) NOT NULL UNIQUE,
  market_initial VARCHAR(10) NOT NULL, -- 마켓 약자 (예: 스마트스토어 = S)
  market_color VARCHAR(20) DEFAULT '200,200,200', -- RGB 색상
  detect_string1 VARCHAR(100), -- 파일명 또는 헤더에서 마켓을 감지하는 문자열 1
  detect_string2 VARCHAR(100), -- 파일명 또는 헤더에서 마켓을 감지하는 문자열 2
  detect_string3 VARCHAR(100), -- 파일명 또는 헤더에서 마켓을 감지하는 문자열 3
  settlement_formula VARCHAR(200), -- 정산 계산 공식 (예: "정산예정금액*1")
  header_row INTEGER DEFAULT 1, -- 엑셀 파일의 헤더 행 번호
  field_mappings JSONB NOT NULL DEFAULT '{}', -- 표준필드 -> 마켓필드 매핑
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_mapping_settings_market_name ON mapping_settings(market_name);

-- 트리거
CREATE TRIGGER update_mapping_settings_updated_at
  BEFORE UPDATE ON mapping_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- 초기 데이터 삽입
-- ===========================
INSERT INTO mapping_settings (market_name, market_initial, market_color, detect_string1, detect_string2, settlement_formula, header_row, field_mappings) VALUES

('스마트스토어', 'N', '0,255,0', '스마트스토어', '네이버페이 주문관리 수수료,매출연동 수수료,판매자 내부코드1', '상품금액*0.9415', 2, '{}'::jsonb),

('esm', 'E', '0,209,255', '발송관리', '판매아이디,배송시 요구사항,서비스이용료,스마일캐시적립', '정산예정금액*1', 1, '{}'::jsonb),

('토스', 'T', '0,128,255', '주문내역', '수령인 연락처', '최종결제금액*0.92', 2, '{}'::jsonb),

('달래마켓', 'D', '0,153,76', '판매자주문', '옵션명', '최종결제금액', 1, '{}'::jsonb),

('올웨이즈', 'A', '243,139,140', '달래마켓', '공동현관 비밀번호', '정산대상금액*0.92', 1, '{}'::jsonb),

('쿠팡', 'C', '243,38,118', 'deliverylist', '노출상품명(옵션명),노출상품ID', '최종결제금액*0.88', 1, '{}'::jsonb),

('11번가', 'S', '250,85,163', 'logistics', '셀러재고코드', '정산예정금액*1', 2, '{}'::jsonb),

('카카오', 'K', '255,255,50', '', '채널상품번호,하이픈포함 수령인연락처1,추천리워드수수료,톡딜여부', '정산대상금액*0.92', 1, '{}'::jsonb),

('CS발송', 'CS', '255,100,80', 'CS', 'CS접수일,직전구매처', '최종결제금액', 2, '{}'::jsonb),

('전화주문', 'PH', '50,255,255', '전화주문', '입금액', '최종결제금액', 2, '{}'::jsonb);

COMMENT ON TABLE mapping_settings IS '각 오픈마켓에서 다운로드한 주문 엑셀의 필드를 표준필드로 매핑하는 설정';
COMMENT ON COLUMN mapping_settings.market_name IS '마켓명 (예: 스마트스토어, 쿠팡, 토스)';
COMMENT ON COLUMN mapping_settings.market_initial IS '마켓 약자 (예: S, C, T)';
COMMENT ON COLUMN mapping_settings.market_color IS 'RGB 색상 (예: 0,209,78)';
COMMENT ON COLUMN mapping_settings.detect_string1 IS '파일명이나 엑셀 헤더에서 마켓을 자동 감지하는 문자열 1';
COMMENT ON COLUMN mapping_settings.detect_string2 IS '파일명이나 엑셀 헤더에서 마켓을 자동 감지하는 문자열 2';
COMMENT ON COLUMN mapping_settings.settlement_formula IS '정산 금액 계산 공식';
COMMENT ON COLUMN mapping_settings.header_row IS '엑셀 파일의 헤더가 있는 행 번호';
COMMENT ON COLUMN mapping_settings.field_mappings IS '표준필드명 -> 마켓별 엑셀 컬럼명 매핑 (JSONB)';
