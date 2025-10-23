-- 고객관리 테이블 생성
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 고객 기본 정보
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,

  -- 고객 타입 (단골고객 / 마케팅대상고객)
  customer_type TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'marketing')),
  -- regular: 단골고객, marketing: 마케팅대상고객

  -- 배송지 정보 (단골고객용 - 주문 등록 시 간편 입력)
  recipient_name TEXT,
  recipient_phone TEXT,
  zonecode TEXT,
  road_address TEXT,
  jibun_address TEXT,
  detail_address TEXT,

  -- 메모
  memo TEXT,

  -- 통계 정보
  total_orders INTEGER DEFAULT 0,
  total_amount NUMERIC(10, 2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,

  -- 관리 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- RLS 정책 (인증된 사용자만 접근)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- integrated_orders 테이블에 customer_id 추가 (고객 연결)
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

CREATE INDEX IF NOT EXISTS idx_integrated_orders_customer_id ON integrated_orders(customer_id);

-- 주문 생성 시 고객 통계 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_orders = (
        SELECT COUNT(*)
        FROM integrated_orders
        WHERE customer_id = NEW.customer_id
          AND is_deleted = FALSE
      ),
      total_amount = (
        SELECT COALESCE(SUM(CAST(total_price AS NUMERIC)), 0)
        FROM integrated_orders
        WHERE customer_id = NEW.customer_id
          AND is_deleted = FALSE
      ),
      last_order_date = (
        SELECT MAX(created_at)
        FROM integrated_orders
        WHERE customer_id = NEW.customer_id
          AND is_deleted = FALSE
      )
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 주문 생성/수정/삭제 시 고객 통계 업데이트 트리거
CREATE TRIGGER trigger_update_customer_stats_on_insert
  AFTER INSERT ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

CREATE TRIGGER trigger_update_customer_stats_on_update
  AFTER UPDATE ON integrated_orders
  FOR EACH ROW
  WHEN (OLD.customer_id IS DISTINCT FROM NEW.customer_id OR OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION update_customer_stats();

CREATE TRIGGER trigger_update_customer_stats_on_delete
  AFTER DELETE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

COMMENT ON TABLE customers IS '고객관리 테이블 (단골고객, 마케팅대상고객)';
COMMENT ON COLUMN customers.customer_type IS '고객 타입: regular(단골고객), marketing(마케팅대상고객)';
COMMENT ON COLUMN customers.total_orders IS '총 주문 수 (자동 계산)';
COMMENT ON COLUMN customers.total_amount IS '총 주문 금액 (자동 계산)';
COMMENT ON COLUMN customers.last_order_date IS '마지막 주문일 (자동 계산)';
