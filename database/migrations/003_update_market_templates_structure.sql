-- =====================================================
-- 마켓 업로드 템플릿 테이블 구조 변경
-- =====================================================

-- 기존 테이블 삭제하고 새로 생성
DROP TABLE IF EXISTS market_upload_templates CASCADE;

CREATE TABLE market_upload_templates (
  id BIGSERIAL PRIMARY KEY,

  -- 마켓 기본 정보
  market_name VARCHAR(50) NOT NULL UNIQUE,
  initial VARCHAR(10),  -- 이니셜 (N, E, T 등)
  color_rgb VARCHAR(20), -- RGB 색상 (0,255,0)
  detect_string1 VARCHAR(100), -- 감지문자열1
  detect_string2 VARCHAR(100), -- 감지문자열2

  -- 정산 정보
  settlement_method VARCHAR(20), -- 정산방식 (formula 등)
  settlement_formula TEXT, -- 정산수식

  -- 엑셀 구조 정보
  header_row INTEGER DEFAULT 1, -- 헤더행 (1부터 시작)
  standard_field_start INTEGER, -- 표준필드시작 컬럼

  -- 필드 매핑 (마켓 엑셀 헤더 → 표준 필드명)
  field_mappings JSONB NOT NULL DEFAULT '{}',

  -- 메타 정보
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 필드 매핑 구조 예시:
-- {
--   "sheet_date": "결제일",
--   "order_number": "주문번호",
--   "buyer_name": "구매자명",
--   "buyer_phone": "구매자연락처",
--   "recipient_name": "수취인명",
--   "recipient_phone": "수취인연락처1",
--   "recipient_address": "통합배송지",
--   "delivery_message": "배송메세지",
--   "option_name": "옵션관리코드",
--   "quantity": "수량",
--   "seller_product_code": "판매자 상품코드",
--   "settlement_amount": "정산예정금액",
--   "product_amount": "최종 상품별 총 주문금액",
--   "discount_amount": "최종 상품별 할인액",
--   "seller_discount": "판매자 부담 할인액",
--   "commission1": "네이버페이 주문관리 수수료",
--   "commission2": "매출연동 수수료",
--   "shipping_fee": "배송비 합계"
-- }

-- 인덱스
CREATE INDEX idx_market_templates_market_name ON market_upload_templates(market_name);
CREATE INDEX idx_market_templates_active ON market_upload_templates(is_active);

-- 트리거
CREATE OR REPLACE FUNCTION update_market_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_market_templates_updated_at ON market_upload_templates;
CREATE TRIGGER trigger_update_market_templates_updated_at
  BEFORE UPDATE ON market_upload_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_market_templates_updated_at();

-- 샘플 데이터 입력
INSERT INTO market_upload_templates (market_name, initial, color_rgb, detect_string1, detect_string2, settlement_method, settlement_formula, header_row, field_mappings) VALUES
('스마트스토어', 'N', '0,255,0', '스마트스토어', '네이버페이 주문관리 수수료', 'formula', '상품금액*0.9415', 2, '{
  "payment_date": "결제일",
  "order_number": "주문번호",
  "buyer_name": "구매자명",
  "buyer_phone": "구매자연락처",
  "recipient_name": "수취인명",
  "recipient_phone": "수취인연락처1",
  "recipient_address": "통합배송지",
  "delivery_message": "배송메세지",
  "option_name": "옵션관리코드",
  "quantity": "수량",
  "seller_product_code": "판매자 상품코드",
  "settlement_amount": "정산예정금액",
  "product_amount": "최종 상품별 총 주문금액",
  "discount_amount": "최종 상품별 할인액",
  "seller_discount": "판매자 부담 할인액",
  "commission1": "네이버페이 주문관리 수수료",
  "commission2": "매출연동 수수료",
  "shipping_fee": "배송비 합계"
}'::jsonb),

('esm', 'E', '0,209,255', '발송관리', '판매아이디', 'formula', '정산예정금액*1', 1, '{
  "payment_date": "주문일(결제확인전)",
  "order_number": "주문번호",
  "buyer_name": "구매자명",
  "buyer_phone": "구매자 휴대폰",
  "recipient_name": "수령인명",
  "recipient_phone": "수령인 휴대폰",
  "recipient_address": "주소",
  "delivery_message": "배송시 요구사항",
  "option_name": "판매자 관리코드",
  "quantity": "수량",
  "product_name": "상품명",
  "settlement_amount": "정산예정금액",
  "product_price": "판매단가",
  "seller_coupon_discount": "판매자쿠폰할인",
  "buyer_coupon_discount": "구매쿠폰적용금액",
  "commission1": "서비스이용료",
  "seller_id": "판매아이디",
  "shipping_fee": "배송비 금액"
}'::jsonb),

('토스', 'T', '0,128,255', '주문내역', '수령인 연락처', 'formula', '최종결제금액*0.92', 2, '{
  "payment_date": "주문일자",
  "order_number": "주문번호",
  "buyer_name": "구매자명",
  "buyer_phone": "구매자 연락처",
  "recipient_name": "수령인명",
  "recipient_phone": "수령인 연락처",
  "recipient_address": "주소",
  "delivery_message": "요청사항",
  "option_name": "옵션코드",
  "quantity": "수량",
  "product_name": "옵션",
  "final_payment_amount": "거래금액",
  "shipping_fee": "배송비합계"
}'::jsonb),

('쿠팡', 'C', '243,38,118', 'deliverylist', '노출상품명(옵션명)', 'formula', '최종결제금액*0.88', 1, '{
  "payment_date": "주문일",
  "order_number": "주문번호",
  "buyer_name": "구매자",
  "buyer_phone": "구매자전화번호",
  "recipient_name": "수취인이름",
  "recipient_phone": "수취인전화번호",
  "recipient_address": "수취인 주소",
  "delivery_message": "배송메세지",
  "option_name": "업체상품코드",
  "quantity": "구매수(수량)",
  "product_name": "등록옵션명",
  "final_payment_amount": "결제액",
  "split_shipping": "분리배송 Y/N",
  "shipping_fee": "배송비"
}'::jsonb),

('11번가', 'S', '250,85,163', 'logistics', '셀러재고코드', 'formula', '정산예정금액*1', 2, '{
  "payment_date": "결제일시",
  "order_number": "주문번호",
  "buyer_name": "구매자",
  "buyer_phone": "전화번호",
  "recipient_name": "수취인",
  "recipient_phone": "휴대폰번호",
  "recipient_address": "주소",
  "delivery_message": "배송메시지",
  "option_name": "셀러재고코드",
  "quantity": "수량",
  "product_name": "옵션",
  "settlement_amount": "정산예정금액",
  "seller_basic_discount": "판매자기본할인금액",
  "seller_additional_discount": "판매자 추가할인금액",
  "commission1": "서비스이용료",
  "shipping_fee": "배송비"
}'::jsonb),

('전화주문', 'PH', '50,255,255', '전화주문', '입금액', 'formula', '최종결제금액', 2, '{
  "payment_date": "주문일",
  "order_number": "주문번호",
  "buyer_name": "주문자",
  "buyer_phone": "주문자 전화번호",
  "recipient_name": "수취인",
  "recipient_phone": "수취인 전화번호",
  "recipient_address": "주소",
  "delivery_message": "배송메새지",
  "option_name": "옵션명",
  "quantity": "수량",
  "special_note": "요청사항",
  "deposit_amount": "입금액"
}'::jsonb);

COMMENT ON TABLE market_upload_templates IS '마켓별 엑셀 업로드 템플릿 설정';
COMMENT ON COLUMN market_upload_templates.field_mappings IS '마켓 엑셀 헤더를 표준 필드명으로 매핑하는 JSON 객체';
