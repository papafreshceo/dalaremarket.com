-- =====================================================
-- vendor_format_settings 테이블 생성
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: 벤더사별 엑셀 업로드 양식 설정 테이블
-- =====================================================

-- 벤더사 양식 설정 테이블 생성
CREATE TABLE IF NOT EXISTS vendor_format_settings (
  id BIGSERIAL PRIMARY KEY,

  -- 벤더사 정보
  vendor_name VARCHAR(100) NOT NULL UNIQUE,
  vendor_code VARCHAR(50),

  -- 표준 필드별 커스텀 헤더명
  payment_date_header VARCHAR(100),           -- 결제일
  order_number_header VARCHAR(100),           -- 주문번호
  buyer_name_header VARCHAR(100),             -- 주문자
  buyer_phone_header VARCHAR(100),            -- 주문자전화번호
  recipient_name_header VARCHAR(100),         -- 수령인
  recipient_phone_header VARCHAR(100),        -- 수령인전화번호
  address_header VARCHAR(100),                -- 주소
  delivery_message_header VARCHAR(100),       -- 배송메세지
  option_name_header VARCHAR(100),            -- 옵션명
  quantity_header VARCHAR(100),               -- 수량
  special_request_header VARCHAR(100),        -- 특이요청사항
  courier_company_header VARCHAR(100),        -- 택배사
  tracking_number_header VARCHAR(100),        -- 송장번호

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX idx_vendor_format_settings_vendor_name ON vendor_format_settings(vendor_name);

-- 트리거: updated_at 자동 업데이트
DROP TRIGGER IF EXISTS trigger_update_vendor_format_settings_updated_at ON vendor_format_settings;
CREATE TRIGGER trigger_update_vendor_format_settings_updated_at
  BEFORE UPDATE ON vendor_format_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE vendor_format_settings IS '벤더사별 엑셀 업로드 양식 설정';
COMMENT ON COLUMN vendor_format_settings.vendor_name IS '벤더사명';
COMMENT ON COLUMN vendor_format_settings.vendor_code IS '거래처코드';
COMMENT ON COLUMN vendor_format_settings.payment_date_header IS '결제일 헤더명';
COMMENT ON COLUMN vendor_format_settings.order_number_header IS '주문번호 헤더명';
COMMENT ON COLUMN vendor_format_settings.buyer_name_header IS '주문자 헤더명';
COMMENT ON COLUMN vendor_format_settings.buyer_phone_header IS '주문자전화번호 헤더명';
COMMENT ON COLUMN vendor_format_settings.recipient_name_header IS '수령인 헤더명';
COMMENT ON COLUMN vendor_format_settings.recipient_phone_header IS '수령인전화번호 헤더명';
COMMENT ON COLUMN vendor_format_settings.address_header IS '주소 헤더명';
COMMENT ON COLUMN vendor_format_settings.delivery_message_header IS '배송메세지 헤더명';
COMMENT ON COLUMN vendor_format_settings.option_name_header IS '옵션명 헤더명';
COMMENT ON COLUMN vendor_format_settings.quantity_header IS '수량 헤더명';
COMMENT ON COLUMN vendor_format_settings.special_request_header IS '특이요청사항 헤더명';
COMMENT ON COLUMN vendor_format_settings.courier_company_header IS '택배사 헤더명';
COMMENT ON COLUMN vendor_format_settings.tracking_number_header IS '송장번호 헤더명';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'vendor_format_settings 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '벤더사별 엑셀 양식 헤더 설정 테이블 생성됨';
  RAISE NOTICE '=================================================';
END $$;
