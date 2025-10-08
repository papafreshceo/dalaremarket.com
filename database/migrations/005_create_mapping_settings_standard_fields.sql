-- ===========================
-- 매핑 설정 표준필드 테이블 생성
-- ===========================
-- 각 마켓의 엑셀 컬럼명을 표준필드로 매핑하는 상세 설정

DROP TABLE IF EXISTS mapping_settings_standard_fields;

CREATE TABLE mapping_settings_standard_fields (
  id SERIAL PRIMARY KEY,
  market_name VARCHAR(50) NOT NULL,
  standard_field VARCHAR(100) NOT NULL, -- 표준필드명
  market_field VARCHAR(200), -- 마켓별 엑셀 컬럼명
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 마켓명 + 표준필드명 조합은 유니크
  UNIQUE(market_name, standard_field),

  -- mapping_settings 테이블 참조
  FOREIGN KEY (market_name) REFERENCES mapping_settings(market_name) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_mapping_standard_fields_market ON mapping_settings_standard_fields(market_name);
CREATE INDEX idx_mapping_standard_fields_standard ON mapping_settings_standard_fields(standard_field);

-- 트리거
CREATE TRIGGER update_mapping_standard_fields_updated_at
  BEFORE UPDATE ON mapping_settings_standard_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE mapping_settings_standard_fields IS '마켓별 엑셀 컬럼명을 표준필드로 매핑하는 상세 설정';
COMMENT ON COLUMN mapping_settings_standard_fields.market_name IS '마켓명 (mapping_settings 테이블 참조)';
COMMENT ON COLUMN mapping_settings_standard_fields.standard_field IS '표준필드명 (예: payment_date, order_number, option_name)';
COMMENT ON COLUMN mapping_settings_standard_fields.market_field IS '마켓별 엑셀 컬럼명 (예: 결제일, 주문번호, 옵션관리코드)';

-- ===========================
-- 초기 데이터 삽입
-- ===========================

-- 스마트스토어
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('스마트스토어', 'payment_date', '결제일'),
('스마트스토어', 'order_number', '주문번호'),
('스마트스토어', 'buyer_name', '구매자명'),
('스마트스토어', 'buyer_phone', '구매자연락처'),
('스마트스토어', 'recipient_name', '수취인명'),
('스마트스토어', 'recipient_phone', '수취인연락처1'),
('스마트스토어', 'recipient_address', '통합배송지'),
('스마트스토어', 'delivery_message', '배송메세지'),
('스마트스토어', 'option_name', '옵션관리코드'),
('스마트스토어', 'quantity', '수량'),
('스마트스토어', 'seller_product_code', '판매자 상품코드'),
('스마트스토어', 'settlement_amount', '정산예정금액'),
('스마트스토어', 'product_amount', '최종 상품별 총 주문금액'),
('스마트스토어', 'discount_amount', '최종 상품별 할인액'),
('스마트스토어', 'seller_discount', '판매자 부담 할인액'),
('스마트스토어', 'commission1', '네이버페이 주문관리 수수료'),
('스마트스토어', 'commission2', '매출연동 수수료'),
('스마트스토어', 'shipping_fee', '배송비 합계');

-- esm
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('esm', 'payment_date', '주문일(결제확인전)'),
('esm', 'order_number', '주문번호'),
('esm', 'buyer_name', '구매자명'),
('esm', 'buyer_phone', '구매자 휴대폰'),
('esm', 'recipient_name', '수령인명'),
('esm', 'recipient_phone', '수령인 휴대폰'),
('esm', 'recipient_address', '주소'),
('esm', 'delivery_message', '배송시 요구사항'),
('esm', 'option_name', '판매자 관리코드'),
('esm', 'quantity', '수량'),
('esm', 'product_name', '상품명'),
('esm', 'settlement_amount', '정산예정금액'),
('esm', 'product_price', '판매단가'),
('esm', 'seller_coupon_discount', '판매자쿠폰할인'),
('esm', 'buyer_coupon_discount', '구매쿠폰적용금액'),
('esm', 'commission1', '서비스이용료'),
('esm', 'seller_id', '판매아이디'),
('esm', 'shipping_fee', '배송비 금액');

-- 토스
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('토스', 'payment_date', '주문일자'),
('토스', 'order_number', '주문번호'),
('토스', 'buyer_name', '구매자명'),
('토스', 'buyer_phone', '구매자 연락처'),
('토스', 'recipient_name', '수령인명'),
('토스', 'recipient_phone', '수령인 연락처'),
('토스', 'recipient_address', '주소'),
('토스', 'delivery_message', '요청사항'),
('토스', 'option_name', '옵션코드'),
('토스', 'quantity', '수량'),
('토스', 'product_name', '옵션'),
('토스', 'settlement_target_amount', '거래금액'),
('토스', 'shipping_fee', '배송비합계');

-- 달래마켓
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('달래마켓', 'payment_date', '주문일시'),
('달래마켓', 'order_number', '주문번호'),
('달래마켓', 'buyer_name', '주문자'),
('달래마켓', 'buyer_phone', '주문자 전화번호'),
('달래마켓', 'recipient_name', '수령인'),
('달래마켓', 'recipient_phone', '수령인 전화번호'),
('달래마켓', 'recipient_address', '주소'),
('달래마켓', 'delivery_message', '요청사항'),
('달래마켓', 'option_name', '옵션명'),
('달래마켓', 'quantity', '수량'),
('달래마켓', 'product_name', '상품명'),
('달래마켓', 'seller_name', '판매자'),
('달래마켓', 'final_payment_amount', '결제금액'),
('달래마켓', 'shipping_fee', '택배비');

-- 올웨이즈
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('올웨이즈', 'payment_date', '주문 시점'),
('올웨이즈', 'order_number', '주문아이디'),
('올웨이즈', 'buyer_name', '수령인'),
('올웨이즈', 'buyer_phone', '수령인 연락처'),
('올웨이즈', 'recipient_name', '수령인'),
('올웨이즈', 'recipient_phone', '수령인 연락처'),
('올웨이즈', 'recipient_address', '주소'),
('올웨이즈', 'delivery_message', '공동현관 비밀번호'),
('올웨이즈', 'option_name', '판매자 상품코드'),
('올웨이즈', 'quantity', '수량'),
('올웨이즈', 'product_name', '옵션'),
('올웨이즈', 'settlement_target_amount', '정산대상금액(수수료 제외)'),
('올웨이즈', 'product_price', '상품가격'),
('올웨이즈', 'platform_coupon_discount', '올웨이즈 부담 쿠폰 할인금'),
('올웨이즈', 'seller_coupon_discount', '판매자 부담 쿠폰 할인금'),
('올웨이즈', 'additional_discount', '추가지원금'),
('올웨이즈', 'shipping_fee', '배송비');

-- 쿠팡
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('쿠팡', 'payment_date', '주문일'),
('쿠팡', 'order_number', '주문번호'),
('쿠팡', 'buyer_name', '구매자'),
('쿠팡', 'buyer_phone', '구매자전화번호'),
('쿠팡', 'recipient_name', '수취인이름'),
('쿠팡', 'recipient_phone', '수취인전화번호'),
('쿠팡', 'recipient_address', '수취인 주소'),
('쿠팡', 'delivery_message', '배송메세지'),
('쿠팡', 'option_name', '업체상품코드'),
('쿠팡', 'quantity', '구매수(수량)'),
('쿠팡', 'product_name', '등록옵션명'),
('쿠팡', 'final_payment_amount', '결제액'),
('쿠팡', 'separate_shipping', '분리배송 Y/N'),
('쿠팡', 'shipping_fee', '배송비');

-- 11번가
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('11번가', 'payment_date', '결제일시'),
('11번가', 'order_number', '주문번호'),
('11번가', 'buyer_name', '구매자'),
('11번가', 'buyer_phone', '전화번호'),
('11번가', 'recipient_name', '수취인'),
('11번가', 'recipient_phone', '휴대폰번호'),
('11번가', 'recipient_address', '주소'),
('11번가', 'delivery_message', '배송메시지'),
('11번가', 'option_name', '셀러재고코드'),
('11번가', 'quantity', '수량'),
('11번가', 'product_name', '옵션'),
('11번가', 'settlement_amount', '정산예정금액'),
('11번가', 'seller_basic_discount', '판매자기본할인금액'),
('11번가', 'seller_additional_discount', '판매자 추가할인금액'),
('11번가', 'commission1', '서비스이용료'),
('11번가', 'shipping_fee', '배송비');

-- 카카오
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('카카오', 'payment_date', '주문일'),
('카카오', 'order_number', '주문번호'),
('카카오', 'recipient_name', '수령인명'),
('카카오', 'recipient_phone', '하이픈포함 수령인연락처1'),
('카카오', 'recipient_address', '배송지주소'),
('카카오', 'delivery_message', '배송메세지'),
('카카오', 'option_name', '옵션코드'),
('카카오', 'quantity', '수량'),
('카카오', 'product_name', '옵션'),
('카카오', 'settlement_base_amount', '정산기준금액'),
('카카오', 'seller_discount', '판매자할인금액'),
('카카오', 'seller_coupon_discount', '판매자쿠폰할인금액'),
('카카오', 'commission1', '기본수수료'),
('카카오', 'shipping_fee', '기본배송비 금액');

-- CS발송
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('CS발송', 'payment_date', 'CS접수일'),
('CS발송', 'buyer_name', '주문자'),
('CS발송', 'buyer_phone', '주문자 전화번호'),
('CS발송', 'recipient_name', '수취인'),
('CS발송', 'recipient_phone', '수취인 전화번호'),
('CS발송', 'recipient_address', '주소'),
('CS발송', 'delivery_message', '배송메새지'),
('CS발송', 'option_name', '옵션명'),
('CS발송', 'quantity', '수량'),
('CS발송', 'special_request', '요청사항'),
('CS발송', 'deposit_amount', '입금액');

-- 전화주문
INSERT INTO mapping_settings_standard_fields (market_name, standard_field, market_field) VALUES
('전화주문', 'payment_date', '주문일'),
('전화주문', 'buyer_name', '주문자'),
('전화주문', 'buyer_phone', '주문자 전화번호'),
('전화주문', 'recipient_name', '수취인'),
('전화주문', 'recipient_phone', '수취인 전화번호'),
('전화주문', 'recipient_address', '주소'),
('전화주문', 'delivery_message', '배송메새지'),
('전화주문', 'option_name', '옵션명'),
('전화주문', 'quantity', '수량'),
('전화주문', 'special_request', '요청사항'),
('전화주문', 'deposit_amount', '입금액');
