-- 주문통합관리 테이블 생성

-- 1. 통합 주문 테이블
CREATE TABLE IF NOT EXISTS integrated_orders (
  id BIGSERIAL PRIMARY KEY,
  seq INTEGER, -- 연번
  sheet_date DATE NOT NULL, -- 주문통합일 (시트 작성일)
  market_name VARCHAR(50) NOT NULL, -- 마켓명 (스마트스토어, 쿠팡, 11번가, 토스, 전화주문 등)
  order_number VARCHAR(100) NOT NULL, -- 주문번호
  payment_date DATE, -- 결제일

  -- 수취인 정보
  recipient_name VARCHAR(100) NOT NULL, -- 수취인명
  recipient_phone VARCHAR(50), -- 수취인 전화번호
  recipient_address TEXT, -- 수취인 주소
  recipient_zipcode VARCHAR(20), -- 우편번호
  delivery_message TEXT, -- 배송 메시지

  -- 상품 정보
  option_name VARCHAR(200) NOT NULL, -- 옵션명
  quantity INTEGER NOT NULL DEFAULT 1, -- 수량
  seller_supply_price DECIMAL(10, 2), -- 셀러공급가

  -- 발송 정보
  shipping_status VARCHAR(50) DEFAULT '미발송', -- 발송상태 (미발송, 발송준비, 발송완료)
  tracking_number VARCHAR(100), -- 송장번호
  courier_company VARCHAR(50), -- 택배사
  shipped_date DATE, -- 발송일

  -- CS 정보
  cs_status VARCHAR(50), -- CS 상태
  cs_type VARCHAR(50), -- CS 유형 (교환, 반품, 취소, 문의 등)
  cs_memo TEXT, -- CS 메모

  -- 기타
  memo TEXT, -- 메모
  tags TEXT[], -- 태그 (배열)

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- 인덱스를 위한 제약조건
  CONSTRAINT integrated_orders_unique_order UNIQUE (market_name, order_number, option_name)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_integrated_orders_sheet_date ON integrated_orders(sheet_date);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_payment_date ON integrated_orders(payment_date);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_market_name ON integrated_orders(market_name);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_order_number ON integrated_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_recipient_name ON integrated_orders(recipient_name);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_shipping_status ON integrated_orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_cs_status ON integrated_orders(cs_status);

-- 3. 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_integrated_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integrated_orders_updated_at
  BEFORE UPDATE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_integrated_orders_updated_at();

-- 4. Row Level Security (RLS) 활성화
ALTER TABLE integrated_orders ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "관리자는 모든 주문 조회 가능" ON integrated_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "관리자는 모든 주문 삽입 가능" ON integrated_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "관리자는 모든 주문 수정 가능" ON integrated_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "관리자는 모든 주문 삭제 가능" ON integrated_orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 6. 댓글 (코멘트) 기능
COMMENT ON TABLE integrated_orders IS '통합 주문 관리 테이블';
COMMENT ON COLUMN integrated_orders.seq IS '연번';
COMMENT ON COLUMN integrated_orders.sheet_date IS '주문통합일 (시트 작성일)';
COMMENT ON COLUMN integrated_orders.market_name IS '마켓명';
COMMENT ON COLUMN integrated_orders.order_number IS '주문번호';
COMMENT ON COLUMN integrated_orders.payment_date IS '결제일';
COMMENT ON COLUMN integrated_orders.recipient_name IS '수취인명';
COMMENT ON COLUMN integrated_orders.option_name IS '옵션명 (상품명)';
COMMENT ON COLUMN integrated_orders.quantity IS '수량';
COMMENT ON COLUMN integrated_orders.seller_supply_price IS '셀러공급가';
COMMENT ON COLUMN integrated_orders.shipping_status IS '발송상태';
COMMENT ON COLUMN integrated_orders.tracking_number IS '송장번호';
