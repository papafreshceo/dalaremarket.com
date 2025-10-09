-- =====================================================
-- 택배사 설정 테이블 생성
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: 택배사별 엑셀 헤더명 매핑 설정
-- =====================================================

-- 택배사 설정 테이블
CREATE TABLE IF NOT EXISTS courier_settings (
  id SERIAL PRIMARY KEY,
  courier_name VARCHAR(100) NOT NULL UNIQUE, -- 택배사명
  courier_header VARCHAR(100), -- 택배사 헤더명
  order_number_header VARCHAR(100), -- 주문번호 헤더명
  tracking_number_header VARCHAR(100), -- 송장번호 헤더명
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_courier_settings_name ON courier_settings(courier_name);

-- 트리거
CREATE TRIGGER update_courier_settings_updated_at
  BEFORE UPDATE ON courier_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 택배사 데이터
INSERT INTO courier_settings (courier_name, courier_header, order_number_header, tracking_number_header) VALUES
('CJ대한통운', '택배사', '주문번호', '송장번호'),
('로젠택배', '택배사', '주문번호', '송장번호'),
('한진택배', '택배사', '주문번호', '송장번호'),
('우체국택배', '택배사', '주문번호', '송장번호')
ON CONFLICT (courier_name) DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '택배사 설정 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '테이블: courier_settings';
  RAISE NOTICE '기본 택배사: CJ대한통운, 로젠택배, 한진택배, 우체국택배';
  RAISE NOTICE '=================================================';
END $$;
