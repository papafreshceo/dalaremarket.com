-- =====================================================
-- 주문통합관리 시스템 - 전체 데이터베이스 마이그레이션
-- =====================================================
-- 작성일: 2025-10-08
-- 설명: Google Sheets 기반 시스템을 Supabase로 마이그레이션
-- =====================================================

-- =====================================================
-- 1. integrated_orders (통합 주문 테이블)
-- =====================================================

DROP TABLE IF EXISTS integrated_orders CASCADE;

CREATE TABLE integrated_orders (
  -- 기본 키
  id BIGSERIAL PRIMARY KEY,

  -- 주문 기본 정보
  sheet_date DATE NOT NULL,
  market_name VARCHAR(50) NOT NULL,
  order_number VARCHAR(100) NOT NULL,
  payment_date DATE,

  -- 수취인 정보
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20),
  recipient_address TEXT,
  recipient_zipcode VARCHAR(10),
  delivery_message TEXT,

  -- 상품 정보
  option_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  seller_supply_price DECIMAL(12,2),

  -- 제품 매칭 정보
  shipping_source VARCHAR(100),
  invoice_issuer VARCHAR(100),
  vendor_name VARCHAR(100),
  shipping_location_name VARCHAR(100),
  shipping_location_address TEXT,
  shipping_location_phone VARCHAR(20),
  shipping_cost DECIMAL(10,2),

  -- 발송 정보
  shipping_status VARCHAR(20) DEFAULT '미발송',
  tracking_number VARCHAR(50),
  courier_company VARCHAR(50),
  shipped_date DATE,

  -- CS 정보
  cs_status VARCHAR(20),
  cs_type VARCHAR(50),
  cs_memo TEXT,

  -- 기타
  memo TEXT,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 고유 제약조건
  CONSTRAINT integrated_orders_unique_order UNIQUE (market_name, order_number, option_name)
);

-- 인덱스 생성
CREATE INDEX idx_integrated_orders_sheet_date ON integrated_orders(sheet_date DESC);
CREATE INDEX idx_integrated_orders_payment_date ON integrated_orders(payment_date DESC);
CREATE INDEX idx_integrated_orders_market ON integrated_orders(market_name);
CREATE INDEX idx_integrated_orders_status ON integrated_orders(shipping_status);
CREATE INDEX idx_integrated_orders_vendor ON integrated_orders(vendor_name);
CREATE INDEX idx_integrated_orders_tracking ON integrated_orders(tracking_number);
CREATE INDEX idx_integrated_orders_order_number ON integrated_orders(order_number);
CREATE INDEX idx_integrated_orders_recipient ON integrated_orders(recipient_name);
CREATE INDEX idx_integrated_orders_created_at ON integrated_orders(created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE integrated_orders IS '통합 주문 테이블 - 모든 마켓의 주문을 통합 관리';
COMMENT ON COLUMN integrated_orders.sheet_date IS '주문통합일';
COMMENT ON COLUMN integrated_orders.shipping_status IS '발송상태: 미발송, 발송준비, 발송완료';

-- =====================================================
-- 2. product_mapping (제품 매핑 테이블)
-- =====================================================

DROP TABLE IF EXISTS product_mapping CASCADE;

CREATE TABLE product_mapping (
  id BIGSERIAL PRIMARY KEY,

  -- 매핑 키
  option_name VARCHAR(200) UNIQUE NOT NULL,

  -- 제품 정보
  shipping_source VARCHAR(100),
  invoice_issuer VARCHAR(100),
  vendor_name VARCHAR(100),
  shipping_location_name VARCHAR(100),
  shipping_location_address TEXT,
  shipping_location_phone VARCHAR(20),
  shipping_cost DECIMAL(10,2),
  seller_supply_price DECIMAL(12,2),

  -- 추가 정보
  product_code VARCHAR(50),
  category VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX idx_product_mapping_option_name ON product_mapping(option_name);
CREATE INDEX idx_product_mapping_vendor ON product_mapping(vendor_name);
CREATE INDEX idx_product_mapping_active ON product_mapping(is_active);
CREATE INDEX idx_product_mapping_product_code ON product_mapping(product_code);

COMMENT ON TABLE product_mapping IS '제품 매핑 테이블 - 옵션명 기반 자동 매칭';
COMMENT ON COLUMN product_mapping.option_name IS '옵션명 (매핑 검색 키)';
COMMENT ON COLUMN product_mapping.seller_supply_price IS '셀러공급가 (단가)';

-- =====================================================
-- 3. cs_records (CS 처리 기록)
-- =====================================================

DROP TABLE IF EXISTS cs_records CASCADE;

CREATE TABLE cs_records (
  id BIGSERIAL PRIMARY KEY,

  -- CS 기본 정보
  receipt_date DATE NOT NULL,
  processing_datetime TIMESTAMP,
  cs_type VARCHAR(50),
  resolution_method VARCHAR(50),

  -- 주문 정보
  order_number VARCHAR(100) NOT NULL,
  market_name VARCHAR(50),

  -- 고객 정보
  orderer_name VARCHAR(100),
  recipient_name VARCHAR(100),
  recipient_phone VARCHAR(20),
  recipient_address TEXT,

  -- 상품 정보
  option_name VARCHAR(200),
  quantity INTEGER,

  -- CS 처리 내용
  cs_reason TEXT,
  cs_content TEXT,
  processing_content TEXT,
  status VARCHAR(20) DEFAULT '접수',

  -- 담당자 및 메모
  manager VARCHAR(50),
  memo TEXT,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 외래 키
  order_id BIGINT REFERENCES integrated_orders(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX idx_cs_records_receipt_date ON cs_records(receipt_date DESC);
CREATE INDEX idx_cs_records_order_number ON cs_records(order_number);
CREATE INDEX idx_cs_records_status ON cs_records(status);
CREATE INDEX idx_cs_records_resolution ON cs_records(resolution_method);
CREATE INDEX idx_cs_records_type ON cs_records(cs_type);
CREATE INDEX idx_cs_records_market ON cs_records(market_name);

COMMENT ON TABLE cs_records IS 'CS 처리 기록 테이블';
COMMENT ON COLUMN cs_records.resolution_method IS '해결방법: 사이트환불, 부분환불, 재발송, 부분재발송, 반품';
COMMENT ON COLUMN cs_records.status IS '처리상태: 접수, 완료';

-- =====================================================
-- 4. regular_customers (단골 고객)
-- =====================================================

DROP TABLE IF EXISTS regular_customers CASCADE;

CREATE TABLE regular_customers (
  id BIGSERIAL PRIMARY KEY,

  -- 고객 기본 정보
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100),
  address TEXT,
  zipcode VARCHAR(10),

  -- 고객 등급
  customer_grade VARCHAR(20) DEFAULT '일반',
  grade_criteria TEXT,

  -- 구매 통계
  total_orders INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  first_order_date DATE,
  last_order_date DATE,

  -- 마케팅
  sms_marketing_agree BOOLEAN DEFAULT FALSE,
  email_marketing_agree BOOLEAN DEFAULT FALSE,

  -- 메모 및 특이사항
  notes TEXT,
  special_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX idx_regular_customers_phone ON regular_customers(phone);
CREATE INDEX idx_regular_customers_grade ON regular_customers(customer_grade);
CREATE INDEX idx_regular_customers_sms ON regular_customers(sms_marketing_agree);
CREATE INDEX idx_regular_customers_active ON regular_customers(is_active);
CREATE INDEX idx_regular_customers_last_order ON regular_customers(last_order_date DESC);

COMMENT ON TABLE regular_customers IS '단골 고객 및 등급 관리';
COMMENT ON COLUMN regular_customers.customer_grade IS '등급: VIP, 우수, 일반, 신규';

-- =====================================================
-- 5. sms_marketing_targets (SMS 마케팅 대상자)
-- =====================================================

DROP TABLE IF EXISTS sms_marketing_targets CASCADE;

CREATE TABLE sms_marketing_targets (
  id BIGSERIAL PRIMARY KEY,

  -- 고객 정보
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,

  -- 마케팅 정보
  campaign_name VARCHAR(100),
  target_reason VARCHAR(200),
  segment VARCHAR(50),

  -- 발송 상태
  sent_status VARCHAR(20) DEFAULT '대기',
  sent_date TIMESTAMP,
  message_content TEXT,

  -- 결과
  response_status VARCHAR(20),
  conversion_date DATE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 외래 키
  customer_id BIGINT REFERENCES regular_customers(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX idx_sms_marketing_phone ON sms_marketing_targets(phone);
CREATE INDEX idx_sms_marketing_campaign ON sms_marketing_targets(campaign_name);
CREATE INDEX idx_sms_marketing_status ON sms_marketing_targets(sent_status);
CREATE INDEX idx_sms_marketing_segment ON sms_marketing_targets(segment);
CREATE INDEX idx_sms_marketing_sent_date ON sms_marketing_targets(sent_date DESC);

COMMENT ON TABLE sms_marketing_targets IS 'SMS 마케팅 캠페인 대상자';
COMMENT ON COLUMN sms_marketing_targets.sent_status IS '발송상태: 대기, 발송완료, 실패';
COMMENT ON COLUMN sms_marketing_targets.segment IS '세그먼트: 신규, 재구매, 휴면복귀';

-- =====================================================
-- 6. market_upload_templates (마켓 업로드 템플릿)
-- =====================================================

DROP TABLE IF EXISTS market_upload_templates CASCADE;

CREATE TABLE market_upload_templates (
  id BIGSERIAL PRIMARY KEY,

  -- 마켓 정보
  market_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),

  -- 필드 매핑 (JSON)
  field_mapping JSONB NOT NULL,

  -- 템플릿 설정
  template_type VARCHAR(20),
  delimiter VARCHAR(5),
  has_header BOOLEAN DEFAULT TRUE,
  encoding VARCHAR(20) DEFAULT 'UTF-8',

  -- 색상 및 UI
  color_code VARCHAR(7),
  icon_url TEXT,

  -- 활성 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX idx_market_templates_active ON market_upload_templates(is_active);
CREATE INDEX idx_market_templates_name ON market_upload_templates(market_name);

COMMENT ON TABLE market_upload_templates IS '마켓별 업로드 양식 관리';
COMMENT ON COLUMN market_upload_templates.field_mapping IS 'JSON 필드 매핑 정보';

-- =====================================================
-- 7. courier_templates (택배사 템플릿)
-- =====================================================

DROP TABLE IF EXISTS courier_templates CASCADE;

CREATE TABLE courier_templates (
  id BIGSERIAL PRIMARY KEY,

  -- 택배사 정보
  courier_name VARCHAR(50) UNIQUE NOT NULL,
  courier_code VARCHAR(20),

  -- 필드 매핑
  field_mapping JSONB NOT NULL,

  -- 템플릿 설정
  template_type VARCHAR(20),
  delimiter VARCHAR(5),
  has_header BOOLEAN DEFAULT TRUE,
  encoding VARCHAR(20) DEFAULT 'UTF-8',

  -- 추적 정보
  tracking_url_pattern TEXT,

  -- 활성 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX idx_courier_templates_active ON courier_templates(is_active);
CREATE INDEX idx_courier_templates_name ON courier_templates(courier_name);

COMMENT ON TABLE courier_templates IS '택배사별 송장 양식 관리';
COMMENT ON COLUMN courier_templates.tracking_url_pattern IS '송장 추적 URL 패턴';

-- =====================================================
-- 8. vendor_templates (벤더사 템플릿)
-- =====================================================

DROP TABLE IF EXISTS vendor_templates CASCADE;

CREATE TABLE vendor_templates (
  id BIGSERIAL PRIMARY KEY,

  -- 벤더사 정보
  vendor_name VARCHAR(100) UNIQUE NOT NULL,
  vendor_code VARCHAR(20),

  -- 연락처 정보
  contact_person VARCHAR(50),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),

  -- 필드 매핑
  field_mapping JSONB NOT NULL,

  -- 템플릿 설정
  template_type VARCHAR(20),
  delimiter VARCHAR(5),
  has_header BOOLEAN DEFAULT TRUE,
  encoding VARCHAR(20) DEFAULT 'UTF-8',

  -- 발송 정보
  default_shipping_location VARCHAR(100),
  default_courier VARCHAR(50),

  -- 활성 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX idx_vendor_templates_active ON vendor_templates(is_active);
CREATE INDEX idx_vendor_templates_name ON vendor_templates(vendor_name);

COMMENT ON TABLE vendor_templates IS '벤더사별 발주/출고 양식 관리';

-- =====================================================
-- 트리거 함수: updated_at 자동 업데이트
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 트리거 생성: 모든 테이블에 updated_at 자동 업데이트 적용
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_integrated_orders_updated_at ON integrated_orders;
CREATE TRIGGER trigger_update_integrated_orders_updated_at
  BEFORE UPDATE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_product_mapping_updated_at ON product_mapping;
CREATE TRIGGER trigger_update_product_mapping_updated_at
  BEFORE UPDATE ON product_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_cs_records_updated_at ON cs_records;
CREATE TRIGGER trigger_update_cs_records_updated_at
  BEFORE UPDATE ON cs_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_regular_customers_updated_at ON regular_customers;
CREATE TRIGGER trigger_update_regular_customers_updated_at
  BEFORE UPDATE ON regular_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sms_marketing_updated_at ON sms_marketing_targets;
CREATE TRIGGER trigger_update_sms_marketing_updated_at
  BEFORE UPDATE ON sms_marketing_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_market_templates_updated_at ON market_upload_templates;
CREATE TRIGGER trigger_update_market_templates_updated_at
  BEFORE UPDATE ON market_upload_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_courier_templates_updated_at ON courier_templates;
CREATE TRIGGER trigger_update_courier_templates_updated_at
  BEFORE UPDATE ON courier_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_vendor_templates_updated_at ON vendor_templates;
CREATE TRIGGER trigger_update_vendor_templates_updated_at
  BEFORE UPDATE ON vendor_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 1. integrated_orders
ALTER TABLE integrated_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 모든 주문 조회 가능" ON integrated_orders;
CREATE POLICY "관리자는 모든 주문 조회 가능"
  ON integrated_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "관리자는 주문 생성 가능" ON integrated_orders;
CREATE POLICY "관리자는 주문 생성 가능"
  ON integrated_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "관리자는 주문 수정 가능" ON integrated_orders;
CREATE POLICY "관리자는 주문 수정 가능"
  ON integrated_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "관리자는 주문 삭제 가능" ON integrated_orders;
CREATE POLICY "관리자는 주문 삭제 가능"
  ON integrated_orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 2. product_mapping
ALTER TABLE product_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 제품 매핑 조회 가능" ON product_mapping;
CREATE POLICY "관리자는 제품 매핑 조회 가능"
  ON product_mapping FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "관리자는 제품 매핑 관리 가능" ON product_mapping;
CREATE POLICY "관리자는 제품 매핑 관리 가능"
  ON product_mapping FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 3. cs_records
ALTER TABLE cs_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 CS 기록 관리 가능" ON cs_records;
CREATE POLICY "관리자는 CS 기록 관리 가능"
  ON cs_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 4. regular_customers
ALTER TABLE regular_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 고객 정보 관리 가능" ON regular_customers;
CREATE POLICY "관리자는 고객 정보 관리 가능"
  ON regular_customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 5. sms_marketing_targets
ALTER TABLE sms_marketing_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 마케팅 대상 관리 가능" ON sms_marketing_targets;
CREATE POLICY "관리자는 마케팅 대상 관리 가능"
  ON sms_marketing_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 6. market_upload_templates
ALTER TABLE market_upload_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 마켓 템플릿 관리 가능" ON market_upload_templates;
CREATE POLICY "관리자는 마켓 템플릿 관리 가능"
  ON market_upload_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 7. courier_templates
ALTER TABLE courier_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 택배사 템플릿 관리 가능" ON courier_templates;
CREATE POLICY "관리자는 택배사 템플릿 관리 가능"
  ON courier_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- 8. vendor_templates
ALTER TABLE vendor_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "관리자는 벤더사 템플릿 관리 가능" ON vendor_templates;
CREATE POLICY "관리자는 벤더사 템플릿 관리 가능"
  ON vendor_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- =====================================================
-- 초기 데이터: 마켓 템플릿
-- =====================================================

INSERT INTO market_upload_templates (market_name, display_name, field_mapping, color_code) VALUES
('스마트스토어', '네이버 스마트스토어', '{
  "주문번호": "order_number",
  "수취인": "recipient_name",
  "전화번호": "recipient_phone",
  "주소": "recipient_address",
  "옵션명": "option_name",
  "수량": "quantity"
}'::jsonb, '#03C75A'),
('쿠팡', '쿠팡', '{
  "주문번호": "order_number",
  "수령인": "recipient_name",
  "연락처": "recipient_phone",
  "배송주소": "recipient_address",
  "상품명": "option_name",
  "수량": "quantity"
}'::jsonb, '#FF6F00'),
('11번가', '11번가', '{
  "주문번호": "order_number",
  "수령자": "recipient_name",
  "휴대폰": "recipient_phone",
  "배송지": "recipient_address",
  "옵션": "option_name",
  "수량": "quantity"
}'::jsonb, '#FF0000'),
('토스', '토스샵', '{
  "주문번호": "order_number",
  "수취인": "recipient_name",
  "전화": "recipient_phone",
  "주소": "recipient_address",
  "옵션명": "option_name",
  "수량": "quantity"
}'::jsonb, '#0064FF'),
('전화주문', '전화주문', '{
  "주문번호": "order_number",
  "수취인": "recipient_name",
  "전화번호": "recipient_phone",
  "주소": "recipient_address",
  "옵션명": "option_name",
  "수량": "quantity"
}'::jsonb, '#6B7280')
ON CONFLICT (market_name) DO NOTHING;

-- =====================================================
-- 초기 데이터: 택배사 템플릿
-- =====================================================

INSERT INTO courier_templates (courier_name, courier_code, field_mapping, tracking_url_pattern) VALUES
('CJ대한통운', 'CJ', '{
  "송장번호": "tracking_number",
  "받는분": "recipient_name",
  "전화번호": "recipient_phone",
  "주소": "recipient_address"
}'::jsonb, 'https://trace.cjlogistics.com/web/detail.jsp?slipno={tracking_number}'),
('롯데택배', 'LOTTE', '{
  "송장번호": "tracking_number",
  "수령인": "recipient_name",
  "연락처": "recipient_phone",
  "배송지": "recipient_address"
}'::jsonb, 'https://www.lotteglogis.com/home/reservation/tracking/index?InvNo={tracking_number}'),
('한진택배', 'HANJIN', '{
  "운송장번호": "tracking_number",
  "받는사람": "recipient_name",
  "전화번호": "recipient_phone",
  "주소": "recipient_address"
}'::jsonb, 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnum={tracking_number}')
ON CONFLICT (courier_name) DO NOTHING;

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '주문통합관리 시스템 마이그레이션 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  1. integrated_orders (통합 주문)';
  RAISE NOTICE '  2. product_mapping (제품 매핑)';
  RAISE NOTICE '  3. cs_records (CS 기록)';
  RAISE NOTICE '  4. regular_customers (단골 고객)';
  RAISE NOTICE '  5. sms_marketing_targets (SMS 마케팅)';
  RAISE NOTICE '  6. market_upload_templates (마켓 템플릿)';
  RAISE NOTICE '  7. courier_templates (택배사 템플릿)';
  RAISE NOTICE '  8. vendor_templates (벤더사 템플릿)';
  RAISE NOTICE '=================================================';
END $$;
