-- customer_type을 단일 값에서 배열로 변경하여 하나의 고객이 여러 타입을 가질 수 있도록 함

-- 1. 기존 customer_type 데이터를 임시로 백업하고 배열로 변환
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_types TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. 기존 customer_type 값을 customer_types 배열로 마이그레이션
UPDATE customers
SET customer_types = ARRAY[customer_type]::TEXT[]
WHERE customer_type IS NOT NULL;

-- 3. 기존 customer_type 컬럼 삭제
ALTER TABLE customers
DROP COLUMN IF EXISTS customer_type;

-- 4. customer_types 컬럼에 체크 제약 조건 추가 (유효한 값만 허용)
ALTER TABLE customers
ADD CONSTRAINT customer_types_check
CHECK (
  customer_types <@ ARRAY['regular', 'marketing']::TEXT[]
  AND array_length(customer_types, 1) > 0
);

-- 5. customer_types 배열에 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_customers_customer_types ON customers USING GIN (customer_types);

-- 6. 코멘트 추가
COMMENT ON COLUMN customers.customer_types IS '고객 유형 배열: regular(단골고객), marketing(마케팅대상고객). 하나의 고객이 여러 유형을 가질 수 있음';
