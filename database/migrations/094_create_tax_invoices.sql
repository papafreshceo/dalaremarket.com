-- 세금계산서 테이블
CREATE TABLE IF NOT EXISTS tax_invoices (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE, -- 승인번호
  issue_date DATE NOT NULL, -- 발급일

  -- 금액 정보
  supply_cost DECIMAL(15,2) NOT NULL DEFAULT 0, -- 공급가액
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- 세액
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- 합계

  -- 파일 정보
  pdf_url TEXT, -- PDF 다운로드 링크
  xml_url TEXT, -- XML 원본 링크

  -- 상태
  status VARCHAR(20) DEFAULT 'issued', -- 'issued', 'cancelled', 'modified'

  -- ASP 연동 정보
  asp_provider VARCHAR(50), -- 'popbill', 'barobill' 등
  asp_invoice_id VARCHAR(100), -- ASP 업체의 계산서 ID

  -- 비고
  remark TEXT,

  -- 메타 정보
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계산서 상세 항목
CREATE TABLE IF NOT EXISTS tax_invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT REFERENCES tax_invoices(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL, -- 품목명
  spec VARCHAR(100), -- 규격
  qty INTEGER DEFAULT 1, -- 수량
  unit_cost DECIMAL(15,2) DEFAULT 0, -- 단가
  supply_cost DECIMAL(15,2) DEFAULT 0, -- 공급가액
  tax_amount DECIMAL(15,2) DEFAULT 0, -- 세액
  remark TEXT, -- 비고
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tax_invoices_organization ON tax_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_issue_date ON tax_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_status ON tax_invoices(status);
CREATE INDEX IF NOT EXISTS idx_tax_invoice_items_invoice ON tax_invoice_items(invoice_id);

-- RLS 정책
ALTER TABLE tax_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_invoice_items ENABLE ROW LEVEL SECURITY;

-- 회원은 자신의 조직 계산서만 조회 가능
CREATE POLICY "Users can view their organization's tax invoices"
  ON tax_invoices
  FOR SELECT
  USING (
    organization_id IN (
      SELECT primary_organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 관리자는 모든 계산서 조회/수정 가능
CREATE POLICY "Admins can manage all tax invoices"
  ON tax_invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 계산서 항목 조회 정책
CREATE POLICY "Users can view invoice items"
  ON tax_invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tax_invoices ti
      JOIN users u ON u.primary_organization_id = ti.organization_id
      WHERE ti.id = tax_invoice_items.invoice_id
      AND u.id = auth.uid()
    )
  );

-- 관리자는 모든 항목 관리 가능
CREATE POLICY "Admins can manage all invoice items"
  ON tax_invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE tax_invoices IS '전자세금계산서 마스터 테이블';
COMMENT ON TABLE tax_invoice_items IS '세금계산서 상세 품목 테이블';
