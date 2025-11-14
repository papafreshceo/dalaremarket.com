-- =====================================================
-- 환불 정산 테이블 생성
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: 환불완료 처리시 정산 데이터를 별도 테이블에 저장
-- =====================================================

-- 1. refund_settlements 테이블 생성
CREATE TABLE IF NOT EXISTS refund_settlements (
  id bigserial PRIMARY KEY,

  -- 주문 정보
  order_id bigint NOT NULL REFERENCES integrated_orders(id) ON DELETE CASCADE,
  order_number text,

  -- 조직 정보
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name text,

  -- 환불 금액 정보
  refund_amount numeric(12, 2) NOT NULL,
  settlement_amount numeric(12, 2),

  -- 환불 계좌 정보
  bank_name text,
  bank_account text,
  account_holder text,

  -- 주문 상세 정보
  market_name text,
  vendor_name text,
  option_name text,
  quantity text,

  -- 처리 정보
  refund_processed_at timestamptz NOT NULL,
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  processed_by_name text,

  -- 메타 정보
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,

  -- 메모
  memo text
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_refund_settlements_order_id ON refund_settlements(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_settlements_organization_id ON refund_settlements(organization_id);
CREATE INDEX IF NOT EXISTS idx_refund_settlements_refund_processed_at ON refund_settlements(refund_processed_at);
CREATE INDEX IF NOT EXISTS idx_refund_settlements_created_at ON refund_settlements(created_at);

-- 3. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_refund_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_refund_settlements_updated_at
  BEFORE UPDATE ON refund_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_refund_settlements_updated_at();

-- 4. RLS 활성화
ALTER TABLE refund_settlements ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 관리자는 모든 환불 정산 데이터 조회 가능
CREATE POLICY "관리자는 모든 환불 정산 데이터 조회 가능"
  ON refund_settlements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'employee')
    )
  );

-- 일반 셀러는 자신의 조직 환불 정산 데이터만 조회 가능
CREATE POLICY "셀러는 자신의 조직 환불 정산 데이터만 조회 가능"
  ON refund_settlements
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT primary_organization_id FROM users WHERE id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- 관리자만 환불 정산 데이터 생성 가능
CREATE POLICY "관리자만 환불 정산 데이터 생성 가능"
  ON refund_settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'employee')
    )
  );

-- 6. 코멘트 추가
COMMENT ON TABLE refund_settlements IS '환불 정산 테이블 - 환불완료 처리 시 정산 데이터 저장';
COMMENT ON COLUMN refund_settlements.order_id IS '원본 주문 ID';
COMMENT ON COLUMN refund_settlements.organization_id IS '조직 ID';
COMMENT ON COLUMN refund_settlements.refund_amount IS '환불 금액';
COMMENT ON COLUMN refund_settlements.bank_name IS '환불 은행명';
COMMENT ON COLUMN refund_settlements.bank_account IS '환불 계좌번호';
COMMENT ON COLUMN refund_settlements.account_holder IS '환불 계좌 예금주';
COMMENT ON COLUMN refund_settlements.refund_processed_at IS '환불 처리 일시';
COMMENT ON COLUMN refund_settlements.processed_by IS '환불 처리자 ID';

-- 7. 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ refund_settlements 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '환불 정산 데이터를 별도 테이블에 저장합니다.';
  RAISE NOTICE '정산 자료 활용을 위한 인덱스 및 RLS 정책 설정 완료';
  RAISE NOTICE '=================================================';
END $$;
