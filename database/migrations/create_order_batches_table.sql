-- 발주 배치 정보를 저장하는 테이블 생성
-- integrated_orders의 confirmed_at 기반 배치 계산은 유지하되,
-- 배치별 입금 정보(캐시 사용액, 입금자명 등)를 별도로 저장

CREATE TABLE IF NOT EXISTS order_batches (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  cash_used NUMERIC NOT NULL DEFAULT 0,
  final_payment_amount NUMERIC NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  depositor_name TEXT,
  executor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, confirmed_at)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_order_batches_organization_id ON order_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_order_batches_confirmed_at ON order_batches(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_order_batches_executor_id ON order_batches(executor_id);

-- 코멘트
COMMENT ON TABLE order_batches IS '발주 배치 정보 (입금 관련 정보 저장)';
COMMENT ON COLUMN order_batches.organization_id IS '조직 ID';
COMMENT ON COLUMN order_batches.confirmed_at IS '발주확정 시간 (배치 식별자)';
COMMENT ON COLUMN order_batches.total_amount IS '캐시 사용 전 총 금액 (정산금액 합계)';
COMMENT ON COLUMN order_batches.cash_used IS '사용된 캐시 금액';
COMMENT ON COLUMN order_batches.final_payment_amount IS '최종 입금 금액 (총금액 - 캐시사용금액)';
COMMENT ON COLUMN order_batches.order_count IS '배치 내 주문 건수';
COMMENT ON COLUMN order_batches.depositor_name IS '입금자명';
COMMENT ON COLUMN order_batches.executor_id IS '발주확정 실행자 ID';
COMMENT ON COLUMN order_batches.payment_confirmed IS '입금 확인 여부';
COMMENT ON COLUMN order_batches.payment_confirmed_at IS '입금 확인 시간';

-- RLS 활성화
ALTER TABLE order_batches ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 관리자는 모든 배치 조회 가능
CREATE POLICY "관리자는 모든 배치 조회 가능" ON order_batches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'employee')
    )
  );

-- RLS 정책: 조직 멤버는 자신의 조직 배치만 조회 가능
CREATE POLICY "조직 멤버는 자신의 조직 배치 조회 가능" ON order_batches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = order_batches.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.status = 'active'
    )
  );

-- RLS 정책: 배치 생성 (조직 멤버만 가능)
CREATE POLICY "조직 멤버는 자신의 조직 배치 생성 가능" ON order_batches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = order_batches.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.status = 'active'
      AND organization_members.can_manage_orders = true
    )
  );

-- RLS 정책: 배치 수정 (조직 멤버 또는 관리자)
CREATE POLICY "배치 수정 권한" ON order_batches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = order_batches.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.status = 'active'
      AND organization_members.can_manage_orders = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'employee')
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_order_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_batches_updated_at
  BEFORE UPDATE ON order_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_order_batches_updated_at();
