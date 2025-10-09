-- =====================================================
-- integrated_orders 테이블 재생성 (표준 필드명 사용)
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: field_X 대신 의미있는 표준 필드명 사용
-- =====================================================

-- 기존 테이블 백업 후 삭제
DROP TABLE IF EXISTS integrated_orders_backup CASCADE;
CREATE TABLE integrated_orders_backup AS SELECT * FROM integrated_orders;
DROP TABLE IF EXISTS integrated_orders CASCADE;

-- 새로운 테이블 생성
CREATE TABLE integrated_orders (
  -- 기본 키
  id BIGSERIAL PRIMARY KEY,

  -- 메타데이터
  sheet_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 표준 필드 43개 (의미있는 이름)
  -- field_1: 마켓명
  market_name VARCHAR(50),

  -- field_2: 연번
  sequence_number VARCHAR(50),

  -- field_3: 결제일
  payment_date VARCHAR(100),

  -- field_4: 주문번호
  order_number VARCHAR(100),

  -- field_5: 주문자
  buyer_name VARCHAR(100),

  -- field_6: 주문자전화번호
  buyer_phone VARCHAR(50),

  -- field_7: 수령인
  recipient_name VARCHAR(100),

  -- field_8: 수령인전화번호
  recipient_phone VARCHAR(50),

  -- field_9: 주소
  recipient_address TEXT,

  -- field_10: 배송메세지
  delivery_message TEXT,

  -- field_11: 옵션명 (option_products 연결)
  option_name VARCHAR(200),

  -- field_12: 수량
  quantity VARCHAR(50),

  -- field_13: 마켓 (확인용, field_1과 중복)
  market_check VARCHAR(50),

  -- field_14: 확인
  confirmation VARCHAR(50),

  -- field_15: 특이/요청사항
  special_request TEXT,

  -- field_16: 발송요청일
  shipping_request_date VARCHAR(100),

  -- field_17: 셀러
  seller_name VARCHAR(100),

  -- field_18: 셀러공급가 (option_products.seller_supply_price와 매칭)
  seller_supply_price VARCHAR(50),

  -- field_19: 출고처
  shipping_source VARCHAR(100),

  -- field_20: 송장주체
  invoice_issuer VARCHAR(100),

  -- field_21: 벤더사
  vendor_name VARCHAR(100),

  -- field_22: 발송지명
  shipping_location_name VARCHAR(100),

  -- field_23: 발송지주소
  shipping_location_address TEXT,

  -- field_24: 발송지연락처
  shipping_location_contact VARCHAR(50),

  -- field_25: 출고비용 (option_products.shipping_cost와 매칭)
  shipping_cost VARCHAR(50),

  -- field_26: 정산예정금액
  settlement_amount VARCHAR(50),

  -- field_27: 정산대상금액
  settlement_target_amount VARCHAR(50),

  -- field_28: 상품금액
  product_amount VARCHAR(50),

  -- field_29: 최종결제금액
  final_payment_amount VARCHAR(50),

  -- field_30: 할인금액
  discount_amount VARCHAR(50),

  -- field_31: 마켓부담할인금액
  platform_discount VARCHAR(50),

  -- field_32: 판매자할인쿠폰할인
  seller_discount VARCHAR(50),

  -- field_33: 구매쿠폰적용금액
  buyer_coupon_discount VARCHAR(50),

  -- field_34: 쿠폰할인금액
  coupon_discount VARCHAR(50),

  -- field_35: 기타지원금할인금
  other_support_discount VARCHAR(50),

  -- field_36: 수수료1
  commission_1 VARCHAR(50),

  -- field_37: 수수료2
  commission_2 VARCHAR(50),

  -- field_38: 판매아이디
  seller_id VARCHAR(100),

  -- field_39: 분리배송 Y/N
  separate_shipping VARCHAR(10),

  -- field_40: 택배비
  delivery_fee VARCHAR(50),

  -- field_41: 발송일(송장입력일)
  shipped_date VARCHAR(100),

  -- field_42: 택배사
  courier_company VARCHAR(50),

  -- field_43: 송장번호
  tracking_number VARCHAR(100),

  -- 고유 제약조건 (마켓명 + 주문번호 + 옵션명)
  CONSTRAINT integrated_orders_unique_order UNIQUE (market_name, order_number, option_name)
);

-- 인덱스 생성
CREATE INDEX idx_integrated_orders_sheet_date ON integrated_orders(sheet_date DESC);
CREATE INDEX idx_integrated_orders_market_name ON integrated_orders(market_name);
CREATE INDEX idx_integrated_orders_order_number ON integrated_orders(order_number);
CREATE INDEX idx_integrated_orders_option_name ON integrated_orders(option_name);
CREATE INDEX idx_integrated_orders_tracking_number ON integrated_orders(tracking_number);
CREATE INDEX idx_integrated_orders_created_at ON integrated_orders(created_at DESC);

-- 트리거: updated_at 자동 업데이트
DROP TRIGGER IF EXISTS trigger_update_integrated_orders_updated_at ON integrated_orders;
CREATE TRIGGER trigger_update_integrated_orders_updated_at
  BEFORE UPDATE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE integrated_orders IS '통합 주문 테이블 - 모든 마켓의 주문을 통합 관리 (표준 필드명 사용)';
COMMENT ON COLUMN integrated_orders.market_name IS '마켓명 (field_1)';
COMMENT ON COLUMN integrated_orders.sequence_number IS '연번 (field_2)';
COMMENT ON COLUMN integrated_orders.payment_date IS '결제일 (field_3)';
COMMENT ON COLUMN integrated_orders.order_number IS '주문번호 (field_4)';
COMMENT ON COLUMN integrated_orders.buyer_name IS '주문자 (field_5)';
COMMENT ON COLUMN integrated_orders.buyer_phone IS '주문자전화번호 (field_6)';
COMMENT ON COLUMN integrated_orders.recipient_name IS '수령인 (field_7)';
COMMENT ON COLUMN integrated_orders.recipient_phone IS '수령인전화번호 (field_8)';
COMMENT ON COLUMN integrated_orders.recipient_address IS '주소 (field_9)';
COMMENT ON COLUMN integrated_orders.delivery_message IS '배송메세지 (field_10)';
COMMENT ON COLUMN integrated_orders.option_name IS '옵션명 - option_products 테이블과 연결 (field_11)';
COMMENT ON COLUMN integrated_orders.quantity IS '수량 (field_12)';
COMMENT ON COLUMN integrated_orders.seller_supply_price IS '셀러공급가 (field_18)';
COMMENT ON COLUMN integrated_orders.shipping_cost IS '출고비용 (field_25)';

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders 테이블 재생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '표준 필드명으로 43개 컬럼 생성 완료';
  RAISE NOTICE '기존 데이터는 integrated_orders_backup에 백업됨';
  RAISE NOTICE 'UNIQUE 제약: (market_name, order_number, option_name)';
  RAISE NOTICE '=================================================';
END $$;
