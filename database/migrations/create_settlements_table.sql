-- =====================================================
-- settlements 테이블 생성
-- =====================================================
-- 목적:
--   조직별 정산 내역을 자동으로 저장하고 관리
--   입금확인 시점에 정산 레코드 생성
--   월별/일별 정산 내역 조회 최적화
-- =====================================================

-- settlements 테이블 생성
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 조직 정보
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- 정산 기간 (발주확정일 기준)
  settlement_year INTEGER NOT NULL,
  settlement_month INTEGER NOT NULL,
  settlement_date DATE NOT NULL, -- 발주확정일

  -- 정산 금액
  confirmed_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- 발주확정 금액
  cancel_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- 취소 금액
  shipped_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- 발송완료 금액
  refund_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- 환불 금액
  net_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- 순정산액 (confirmed - cancel)

  -- 주문 건수
  confirmed_count INTEGER NOT NULL DEFAULT 0,
  cancel_count INTEGER NOT NULL DEFAULT 0,
  shipped_count INTEGER NOT NULL DEFAULT 0,
  refund_count INTEGER NOT NULL DEFAULT 0,

  -- 입금 정보
  payment_confirmed_at TIMESTAMP WITH TIME ZONE, -- 입금확인 일시
  confirmed_by UUID REFERENCES users(id), -- 입금확인자

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 복합 유니크 제약 (조직 + 날짜별로 하나의 정산 레코드만 존재)
  CONSTRAINT unique_settlement_per_day UNIQUE (organization_id, settlement_date)
);

-- 인덱스 생성 (이미 존재하면 스킵)
CREATE INDEX IF NOT EXISTS idx_settlements_organization ON settlements(organization_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlements_year_month ON settlements(settlement_year, settlement_month);
CREATE INDEX IF NOT EXISTS idx_settlements_organization_date ON settlements(organization_id, settlement_date);

-- RLS (Row Level Security) 정책
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 정산 내역 조회 가능
CREATE POLICY "관리자 전체 조회" ON settlements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'employee')
    )
  );

-- 조직 소속 사용자는 자신의 조직 정산 내역만 조회 가능
CREATE POLICY "조직 정산 조회" ON settlements
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT primary_organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- 관리자만 정산 레코드 생성/수정 가능
CREATE POLICY "관리자 정산 생성" ON settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'employee')
    )
  );

CREATE POLICY "관리자 정산 수정" ON settlements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'employee')
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_settlements_updated_at();

-- 정산 집계 함수: 조직별 일별 정산 자동 생성/업데이트
CREATE OR REPLACE FUNCTION upsert_settlement(
  p_organization_id UUID,
  p_settlement_date DATE,
  p_confirmed_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_settlement_id UUID;
  v_confirmed_amount DECIMAL(15, 2);
  v_cancel_amount DECIMAL(15, 2);
  v_shipped_amount DECIMAL(15, 2);
  v_refund_amount DECIMAL(15, 2);
  v_confirmed_count INTEGER;
  v_cancel_count INTEGER;
  v_shipped_count INTEGER;
  v_refund_count INTEGER;
BEGIN
  -- 해당 조직의 해당 날짜 주문 통계 집계
  SELECT
    COALESCE(SUM(CASE
      WHEN shipping_status IN ('발주서확정', '결제완료', '상품준비중', '발송완료')
      THEN CAST(COALESCE(final_payment_amount, settlement_amount, '0') AS DECIMAL(15, 2))
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN shipping_status IN ('취소요청', '취소완료')
      THEN CAST(COALESCE(final_payment_amount, settlement_amount, '0') AS DECIMAL(15, 2))
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN shipping_status = '발송완료'
      THEN CAST(COALESCE(final_payment_amount, settlement_amount, '0') AS DECIMAL(15, 2))
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN refund_processed_at IS NOT NULL
      THEN CAST(COALESCE(final_payment_amount, settlement_amount, '0') AS DECIMAL(15, 2))
      ELSE 0
    END), 0),
    COUNT(CASE WHEN shipping_status IN ('발주서확정', '결제완료', '상품준비중', '발송완료') THEN 1 END),
    COUNT(CASE WHEN shipping_status IN ('취소요청', '취소완료') THEN 1 END),
    COUNT(CASE WHEN shipping_status = '발송완료' THEN 1 END),
    COUNT(CASE WHEN refund_processed_at IS NOT NULL THEN 1 END)
  INTO
    v_confirmed_amount,
    v_cancel_amount,
    v_shipped_amount,
    v_refund_amount,
    v_confirmed_count,
    v_cancel_count,
    v_shipped_count,
    v_refund_count
  FROM integrated_orders
  WHERE organization_id = p_organization_id
    AND DATE(confirmed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') = p_settlement_date
    AND confirmed_at IS NOT NULL
    AND is_deleted = FALSE;

  -- UPSERT: 정산 레코드 생성 또는 업데이트
  INSERT INTO settlements (
    organization_id,
    settlement_year,
    settlement_month,
    settlement_date,
    confirmed_amount,
    cancel_amount,
    shipped_amount,
    refund_amount,
    net_amount,
    confirmed_count,
    cancel_count,
    shipped_count,
    refund_count,
    payment_confirmed_at,
    confirmed_by
  ) VALUES (
    p_organization_id,
    EXTRACT(YEAR FROM p_settlement_date),
    EXTRACT(MONTH FROM p_settlement_date),
    p_settlement_date,
    v_confirmed_amount,
    v_cancel_amount,
    v_shipped_amount,
    v_refund_amount,
    v_confirmed_amount - v_cancel_amount,
    v_confirmed_count,
    v_cancel_count,
    v_shipped_count,
    v_refund_count,
    CASE WHEN p_confirmed_by IS NOT NULL THEN NOW() ELSE NULL END,
    p_confirmed_by
  )
  ON CONFLICT (organization_id, settlement_date)
  DO UPDATE SET
    confirmed_amount = EXCLUDED.confirmed_amount,
    cancel_amount = EXCLUDED.cancel_amount,
    shipped_amount = EXCLUDED.shipped_amount,
    refund_amount = EXCLUDED.refund_amount,
    net_amount = EXCLUDED.net_amount,
    confirmed_count = EXCLUDED.confirmed_count,
    cancel_count = EXCLUDED.cancel_count,
    shipped_count = EXCLUDED.shipped_count,
    refund_count = EXCLUDED.refund_count,
    payment_confirmed_at = COALESCE(settlements.payment_confirmed_at, EXCLUDED.payment_confirmed_at),
    confirmed_by = COALESCE(settlements.confirmed_by, EXCLUDED.confirmed_by),
    updated_at = NOW()
  RETURNING id INTO v_settlement_id;

  RETURN v_settlement_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_settlement IS '조직별 일별 정산 레코드 자동 생성/업데이트';

-- 월별 정산 조회 뷰
CREATE OR REPLACE VIEW v_monthly_settlements AS
SELECT
  organization_id,
  settlement_year,
  settlement_month,
  SUM(confirmed_amount) AS monthly_confirmed_amount,
  SUM(cancel_amount) AS monthly_cancel_amount,
  SUM(shipped_amount) AS monthly_shipped_amount,
  SUM(refund_amount) AS monthly_refund_amount,
  SUM(net_amount) AS monthly_net_amount,
  SUM(confirmed_count) AS monthly_confirmed_count,
  SUM(cancel_count) AS monthly_cancel_count,
  SUM(shipped_count) AS monthly_shipped_count,
  SUM(refund_count) AS monthly_refund_count,
  MIN(settlement_date) AS period_start,
  MAX(settlement_date) AS period_end,
  COUNT(*) AS settlement_days
FROM settlements
GROUP BY organization_id, settlement_year, settlement_month;

COMMENT ON VIEW v_monthly_settlements IS '조직별 월별 정산 집계 뷰';

-- 테이블 코멘트
COMMENT ON TABLE settlements IS '조직별 정산 내역 (입금확인 시 자동 생성)';
COMMENT ON COLUMN settlements.organization_id IS '정산 대상 조직 ID';
COMMENT ON COLUMN settlements.settlement_date IS '정산 기준일 (발주확정일, KST)';
COMMENT ON COLUMN settlements.confirmed_amount IS '발주확정 금액 (입금 대상)';
COMMENT ON COLUMN settlements.net_amount IS '순정산액 (확정 - 취소)';
COMMENT ON COLUMN settlements.payment_confirmed_at IS '입금확인 일시 (관리자 확인)';
