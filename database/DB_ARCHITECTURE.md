# 주문통합관리 시스템 - 데이터베이스 아키텍처

## 개요
Google Sheets 기반 시스템을 Supabase PostgreSQL로 마이그레이션하는 최적화된 데이터베이스 설계

## 기존 Google Sheets 구조
- **주문접수**: 각 날짜별 주문 데이터 (동적 시트)
- **cs기록**: 고객 서비스 처리 내역
- **단골고객**: 단골 고객 정보
- **문자마케팅대상고객**: SMS 마케팅 대상자 목록
- **고객등급별관리**: 고객 등급/세그먼트 관리
- **매핑**: 옵션명 → 제품 정보 매핑
- **마켓업로드템플릿**: 마켓별 업로드 양식
- **택배사템플릿**: 택배사별 양식
- **벤더사템플릿**: 벤더사별 양식

## 최적화된 Supabase 테이블 설계

### 1. integrated_orders (통합 주문 테이블)
**목적**: 모든 마켓의 주문을 통합 관리 (기존: 날짜별 시트)

```sql
CREATE TABLE integrated_orders (
  -- 기본 키
  id BIGSERIAL PRIMARY KEY,

  -- 주문 기본 정보
  sheet_date DATE NOT NULL,                    -- 주문통합일
  market_name VARCHAR(50) NOT NULL,            -- 마켓명 (스마트스토어, 쿠팡, 11번가, 토스, 전화주문)
  order_number VARCHAR(100) NOT NULL,          -- 주문번호
  payment_date DATE,                           -- 결제일

  -- 수취인 정보
  recipient_name VARCHAR(100) NOT NULL,        -- 수취인명
  recipient_phone VARCHAR(20),                 -- 전화번호
  recipient_address TEXT,                      -- 주소
  recipient_zipcode VARCHAR(10),               -- 우편번호
  delivery_message TEXT,                       -- 배송메시지

  -- 상품 정보
  option_name VARCHAR(200) NOT NULL,           -- 옵션명 (매핑 키)
  quantity INTEGER NOT NULL DEFAULT 1,         -- 수량
  seller_supply_price DECIMAL(12,2),           -- 셀러공급가

  -- 제품 매칭 정보 (product_mapping에서 자동 채워짐)
  shipping_source VARCHAR(100),                -- 출고처
  invoice_issuer VARCHAR(100),                 -- 송장주체
  vendor_name VARCHAR(100),                    -- 벤더사
  shipping_location_name VARCHAR(100),         -- 발송지명
  shipping_location_address TEXT,              -- 발송지주소
  shipping_location_phone VARCHAR(20),         -- 발송지연락처
  shipping_cost DECIMAL(10,2),                 -- 출고비용

  -- 발송 정보
  shipping_status VARCHAR(20) DEFAULT '미발송', -- 미발송, 발송준비, 발송완료
  tracking_number VARCHAR(50),                 -- 송장번호
  courier_company VARCHAR(50),                 -- 택배사
  shipped_date DATE,                           -- 발송일

  -- CS 정보
  cs_status VARCHAR(20),                       -- CS상태
  cs_type VARCHAR(50),                         -- CS유형
  cs_memo TEXT,                                -- CS메모

  -- 기타
  memo TEXT,                                   -- 일반 메모

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 고유 제약조건 (중복 주문 방지)
  CONSTRAINT integrated_orders_unique_order UNIQUE (market_name, order_number, option_name)
);

-- 인덱스
CREATE INDEX idx_integrated_orders_sheet_date ON integrated_orders(sheet_date);
CREATE INDEX idx_integrated_orders_payment_date ON integrated_orders(payment_date);
CREATE INDEX idx_integrated_orders_market ON integrated_orders(market_name);
CREATE INDEX idx_integrated_orders_status ON integrated_orders(shipping_status);
CREATE INDEX idx_integrated_orders_vendor ON integrated_orders(vendor_name);
CREATE INDEX idx_integrated_orders_tracking ON integrated_orders(tracking_number);
```

---

### 2. product_mapping (제품 매핑 테이블)
**목적**: 옵션명을 기준으로 제품 정보 자동 매핑 (기존: '매핑' 시트)

```sql
CREATE TABLE product_mapping (
  id BIGSERIAL PRIMARY KEY,

  -- 매핑 키
  option_name VARCHAR(200) UNIQUE NOT NULL,    -- 옵션명 (검색 키)

  -- 제품 정보
  shipping_source VARCHAR(100),                -- 출고처
  invoice_issuer VARCHAR(100),                 -- 송장주체
  vendor_name VARCHAR(100),                    -- 벤더사
  shipping_location_name VARCHAR(100),         -- 발송지명
  shipping_location_address TEXT,              -- 발송지주소
  shipping_location_phone VARCHAR(20),         -- 발송지연락처
  shipping_cost DECIMAL(10,2),                 -- 출고비용
  seller_supply_price DECIMAL(12,2),           -- 셀러공급가 (단가)

  -- 추가 정보
  product_code VARCHAR(50),                    -- 상품코드
  category VARCHAR(100),                       -- 카테고리
  notes TEXT,                                  -- 비고
  is_active BOOLEAN DEFAULT TRUE,              -- 활성 상태

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX idx_product_mapping_option_name ON product_mapping(option_name);
CREATE INDEX idx_product_mapping_vendor ON product_mapping(vendor_name);
CREATE INDEX idx_product_mapping_active ON product_mapping(is_active);
```

---

### 3. cs_records (CS 처리 기록)
**목적**: 고객 서비스 처리 내역 관리 (기존: 'cs기록' 시트)

```sql
CREATE TABLE cs_records (
  id BIGSERIAL PRIMARY KEY,

  -- CS 기본 정보
  receipt_date DATE NOT NULL,                  -- 접수일
  processing_datetime TIMESTAMP,               -- 처리일시
  cs_type VARCHAR(50),                         -- CS구분 (교환, 반품, 재발송, 기타)
  resolution_method VARCHAR(50),               -- 해결방법 (사이트환불, 부분환불, 재발송, 부분재발송, 반품)

  -- 주문 정보
  order_number VARCHAR(100) NOT NULL,          -- 주문번호
  market_name VARCHAR(50),                     -- 마켓명

  -- 고객 정보
  orderer_name VARCHAR(100),                   -- 주문자
  recipient_name VARCHAR(100),                 -- 수령인
  recipient_phone VARCHAR(20),                 -- 전화번호
  recipient_address TEXT,                      -- 주소

  -- 상품 정보
  option_name VARCHAR(200),                    -- 옵션명
  quantity INTEGER,                            -- 수량

  -- CS 처리 내용
  cs_reason TEXT,                              -- CS사유
  cs_content TEXT,                             -- CS 내용
  processing_content TEXT,                     -- 처리내용
  status VARCHAR(20) DEFAULT '접수',            -- 처리상태 (접수, 완료)

  -- 담당자 및 메모
  manager VARCHAR(50),                         -- 담당자
  memo TEXT,                                   -- 메모

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 외래 키 (선택적)
  order_id BIGINT REFERENCES integrated_orders(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX idx_cs_records_receipt_date ON cs_records(receipt_date);
CREATE INDEX idx_cs_records_order_number ON cs_records(order_number);
CREATE INDEX idx_cs_records_status ON cs_records(status);
CREATE INDEX idx_cs_records_resolution ON cs_records(resolution_method);
CREATE INDEX idx_cs_records_type ON cs_records(cs_type);
```

---

### 4. regular_customers (단골 고객)
**목적**: 단골 고객 정보 및 등급 관리 (기존: '단골고객', '고객등급별관리' 시트 통합)

```sql
CREATE TABLE regular_customers (
  id BIGSERIAL PRIMARY KEY,

  -- 고객 기본 정보
  customer_name VARCHAR(100) NOT NULL,         -- 고객명
  phone VARCHAR(20) UNIQUE,                    -- 전화번호 (고유 식별자)
  email VARCHAR(100),                          -- 이메일
  address TEXT,                                -- 주소
  zipcode VARCHAR(10),                         -- 우편번호

  -- 고객 등급
  customer_grade VARCHAR(20) DEFAULT '일반',    -- 등급 (VIP, 우수, 일반, 신규)
  grade_criteria TEXT,                         -- 등급 기준 설명

  -- 구매 통계
  total_orders INTEGER DEFAULT 0,              -- 총 주문 건수
  total_amount DECIMAL(12,2) DEFAULT 0,        -- 총 구매금액
  first_order_date DATE,                       -- 최초 주문일
  last_order_date DATE,                        -- 최근 주문일

  -- 마케팅
  sms_marketing_agree BOOLEAN DEFAULT FALSE,   -- SMS 수신 동의
  email_marketing_agree BOOLEAN DEFAULT FALSE, -- 이메일 수신 동의

  -- 메모 및 특이사항
  notes TEXT,                                  -- 메모
  special_notes TEXT,                          -- 특이사항
  is_active BOOLEAN DEFAULT TRUE,              -- 활성 상태

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX idx_regular_customers_phone ON regular_customers(phone);
CREATE INDEX idx_regular_customers_grade ON regular_customers(customer_grade);
CREATE INDEX idx_regular_customers_sms ON regular_customers(sms_marketing_agree);
CREATE INDEX idx_regular_customers_active ON regular_customers(is_active);
```

---

### 5. sms_marketing_targets (SMS 마케팅 대상자)
**목적**: SMS 마케팅 캠페인 대상자 관리 (기존: '문자마케팅대상고객' 시트)

```sql
CREATE TABLE sms_marketing_targets (
  id BIGSERIAL PRIMARY KEY,

  -- 고객 정보
  customer_name VARCHAR(100) NOT NULL,         -- 고객명
  phone VARCHAR(20) NOT NULL,                  -- 전화번호

  -- 마케팅 정보
  campaign_name VARCHAR(100),                  -- 캠페인명
  target_reason VARCHAR(200),                  -- 타겟 선정 이유
  segment VARCHAR(50),                         -- 세그먼트 (신규, 재구매, 휴면복귀)

  -- 발송 상태
  sent_status VARCHAR(20) DEFAULT '대기',       -- 발송상태 (대기, 발송완료, 실패)
  sent_date TIMESTAMP,                         -- 발송일시
  message_content TEXT,                        -- 발송 메시지 내용

  -- 결과
  response_status VARCHAR(20),                 -- 응답상태 (응답, 미응답, 수신거부)
  conversion_date DATE,                        -- 전환일 (주문한 날짜)

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 외래 키
  customer_id BIGINT REFERENCES regular_customers(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX idx_sms_marketing_phone ON sms_marketing_targets(phone);
CREATE INDEX idx_sms_marketing_campaign ON sms_marketing_targets(campaign_name);
CREATE INDEX idx_sms_marketing_status ON sms_marketing_targets(sent_status);
CREATE INDEX idx_sms_marketing_segment ON sms_marketing_targets(segment);
```

---

### 6. market_upload_templates (마켓 업로드 템플릿)
**목적**: 마켓별 업로드 양식 관리 (기존: '마켓업로드템플릿' 시트)

```sql
CREATE TABLE market_upload_templates (
  id BIGSERIAL PRIMARY KEY,

  -- 마켓 정보
  market_name VARCHAR(50) UNIQUE NOT NULL,     -- 마켓명
  display_name VARCHAR(100),                   -- 표시명

  -- 필드 매핑 (JSON)
  field_mapping JSONB NOT NULL,                -- 필드 매핑 정보
  /*
  예시:
  {
    "주문번호": "orderNumber",
    "수취인": "recipientName",
    "주소": "address",
    "전화번호": "phone",
    ...
  }
  */

  -- 템플릿 설정
  template_type VARCHAR(20),                   -- 템플릿 유형 (엑셀, CSV)
  delimiter VARCHAR(5),                        -- 구분자 (CSV용)
  has_header BOOLEAN DEFAULT TRUE,             -- 헤더 포함 여부
  encoding VARCHAR(20) DEFAULT 'UTF-8',        -- 인코딩

  -- 색상 및 UI
  color_code VARCHAR(7),                       -- 마켓 색상 코드
  icon_url TEXT,                               -- 아이콘 URL

  -- 활성 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX idx_market_templates_active ON market_upload_templates(is_active);
```

---

### 7. courier_templates (택배사 템플릿)
**목적**: 택배사별 송장 업로드/다운로드 양식 (기존: '택배사템플릿' 시트)

```sql
CREATE TABLE courier_templates (
  id BIGSERIAL PRIMARY KEY,

  -- 택배사 정보
  courier_name VARCHAR(50) UNIQUE NOT NULL,    -- 택배사명
  courier_code VARCHAR(20),                    -- 택배사 코드

  -- 필드 매핑
  field_mapping JSONB NOT NULL,                -- 필드 매핑 정보

  -- 템플릿 설정
  template_type VARCHAR(20),                   -- 템플릿 유형
  delimiter VARCHAR(5),
  has_header BOOLEAN DEFAULT TRUE,
  encoding VARCHAR(20) DEFAULT 'UTF-8',

  -- 추적 정보
  tracking_url_pattern TEXT,                   -- 송장 추적 URL 패턴

  -- 활성 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX idx_courier_templates_active ON courier_templates(is_active);
```

---

### 8. vendor_templates (벤더사 템플릿)
**목적**: 벤더사별 발주/출고 양식 (기존: '벤더사템플릿' 시트)

```sql
CREATE TABLE vendor_templates (
  id BIGSERIAL PRIMARY KEY,

  -- 벤더사 정보
  vendor_name VARCHAR(100) UNIQUE NOT NULL,    -- 벤더사명
  vendor_code VARCHAR(20),                     -- 벤더사 코드

  -- 연락처 정보
  contact_person VARCHAR(50),                  -- 담당자
  contact_phone VARCHAR(20),                   -- 연락처
  contact_email VARCHAR(100),                  -- 이메일

  -- 필드 매핑
  field_mapping JSONB NOT NULL,                -- 필드 매핑 정보

  -- 템플릿 설정
  template_type VARCHAR(20),
  delimiter VARCHAR(5),
  has_header BOOLEAN DEFAULT TRUE,
  encoding VARCHAR(20) DEFAULT 'UTF-8',

  -- 발송 정보
  default_shipping_location VARCHAR(100),      -- 기본 발송지
  default_courier VARCHAR(50),                 -- 기본 택배사

  -- 활성 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX idx_vendor_templates_active ON vendor_templates(is_active);
CREATE INDEX idx_vendor_templates_name ON vendor_templates(vendor_name);
```

---

## 관계도 (ERD)

```
integrated_orders (주문)
    ↓ (option_name)
product_mapping (제품 매핑)
    ↓ (vendor_name)
vendor_templates (벤더사)

integrated_orders (주문)
    ↓ (order_id)
cs_records (CS 기록)

regular_customers (단골 고객)
    ↓ (customer_id)
sms_marketing_targets (SMS 마케팅)
```

---

## 주요 최적화 포인트

### 1. **날짜별 시트 → 단일 통합 테이블**
- 기존: 매일 새로운 시트 생성
- 개선: `integrated_orders` 테이블에 `sheet_date` 필드로 관리
- 장점: 쿼리 효율, 통계 집계 용이

### 2. **제품 정보 자동 매핑**
- `product_mapping` 테이블을 통한 옵션명 기반 자동 매칭
- 벤더사, 출고처, 셀러공급가 등 자동 채워짐

### 3. **고객 데이터 정규화**
- 단골고객 + 고객등급별관리 → `regular_customers` 단일 테이블
- 중복 제거, 구매 통계 자동 집계

### 4. **템플릿 JSONB 활용**
- 유연한 필드 매핑 (마켓/택배사/벤더사별 다른 양식 지원)
- 스키마 변경 없이 확장 가능

### 5. **인덱스 최적화**
- 자주 조회되는 필드에 인덱스 설정
- 날짜, 마켓명, 벤더사, 송장번호, 상태 등

---

## RLS (Row Level Security) 정책

모든 테이블에 대해 관리자/매니저만 접근 가능하도록 RLS 설정

```sql
-- 예시: integrated_orders 테이블
ALTER TABLE integrated_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자는 모든 주문 조회 가능"
  ON integrated_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "관리자는 주문 생성 가능"
  ON integrated_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- (UPDATE, DELETE 정책도 동일하게 추가)
```

---

## 트리거 (자동화)

### 1. updated_at 자동 업데이트
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
CREATE TRIGGER update_integrated_orders_updated_at
  BEFORE UPDATE ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. 고객 구매 통계 자동 업데이트
```sql
-- integrated_orders 테이블에 주문 추가 시 regular_customers 업데이트
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE regular_customers
  SET
    total_orders = total_orders + 1,
    total_amount = total_amount + NEW.seller_supply_price,
    last_order_date = NEW.sheet_date
  WHERE phone = NEW.recipient_phone;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();
```

---

## 다음 단계

1. ✅ DB 스키마 설계 완료
2. ⏳ 마이그레이션 SQL 파일 작성
3. ⏳ API 엔드포인트 구현
4. ⏳ 프론트엔드 컴포넌트 개발 (EditableAdminGrid 활용)
5. ⏳ 데이터 마이그레이션 (Google Sheets → Supabase)
