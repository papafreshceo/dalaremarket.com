-- =====================================================
-- 환불 유형 설정 테이블 생성 및 환불 필드 추가
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: 환불 유형을 관리하는 테이블 생성 및 integrated_orders에 환불 관련 필드 추가
-- =====================================================

-- 1. 환불 유형 설정 테이블 생성
CREATE TABLE IF NOT EXISTS refund_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. integrated_orders에 환불 관련 필드 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_type VARCHAR(50) REFERENCES refund_types(code),
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- 3. 코멘트 추가
COMMENT ON TABLE refund_types IS '환불 유형 설정 테이블';
COMMENT ON COLUMN refund_types.code IS '환불 유형 코드 (영문, 고유값)';
COMMENT ON COLUMN refund_types.name IS '환불 유형 표시명 (한글)';
COMMENT ON COLUMN refund_types.description IS '환불 유형 설명';
COMMENT ON COLUMN refund_types.is_active IS '활성화 여부';
COMMENT ON COLUMN refund_types.display_order IS '표시 순서';

COMMENT ON COLUMN integrated_orders.refund_amount IS '환불 금액';
COMMENT ON COLUMN integrated_orders.refund_type IS '환불 유형 (refund_types.code 참조)';
COMMENT ON COLUMN integrated_orders.refund_reason IS '환불 사유';

-- 4. 기본 환불 유형 데이터 삽입
INSERT INTO refund_types (code, name, description, display_order, is_active) VALUES
  ('cancel_refund', '셀러 취소 환불', '셀러의 취소 요청으로 인한 전체 환불', 1, true),
  ('partial_customer', '고객 부분 환불', '고객 요청으로 인한 일부 금액 환불', 2, true),
  ('full_customer', '고객 전체 환불', '고객 요청으로 인한 전체 환불', 3, true),
  ('compensation', '고객 보상', '품질 문제나 배송 지연 등으로 인한 보상', 4, true),
  ('shipping_issue', '배송 문제 환불', '배송 사고나 분실 등으로 인한 환불', 5, true)
ON CONFLICT (code) DO NOTHING;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_refund_types_active ON refund_types(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_refund_type ON integrated_orders(refund_type);

-- 6. RLS 정책 설정 (관리자만 수정, 모든 인증된 사용자 읽기 가능)
ALTER TABLE refund_types ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 인증된 사용자
CREATE POLICY "Allow authenticated users to read refund types"
  ON refund_types FOR SELECT
  TO authenticated
  USING (true);

-- 쓰기: 관리자만 (user_metadata의 role이 'admin'인 경우)
CREATE POLICY "Allow admin to manage refund types"
  ON refund_types FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '환불 유형 설정 시스템 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '테이블: refund_types';
  RAISE NOTICE '기본 환불 유형 5개 삽입 완료';
  RAISE NOTICE 'integrated_orders 필드: refund_amount, refund_type, refund_reason';
  RAISE NOTICE 'RLS 정책 설정 완료';
  RAISE NOTICE '=================================================';
END $$;
