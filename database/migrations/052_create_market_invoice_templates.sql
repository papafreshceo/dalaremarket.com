-- 마켓 송장 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS market_invoice_templates (
  id BIGSERIAL PRIMARY KEY,
  market_name TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 비활성화
ALTER TABLE market_invoice_templates DISABLE ROW LEVEL SECURITY;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_market_invoice_templates_market_name
  ON market_invoice_templates(market_name);

CREATE INDEX IF NOT EXISTS idx_market_invoice_templates_is_active
  ON market_invoice_templates(is_active);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_market_invoice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_market_invoice_templates_updated_at
  BEFORE UPDATE ON market_invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_market_invoice_templates_updated_at();

-- 기본 템플릿 추가
INSERT INTO market_invoice_templates (market_name, template_name, columns)
VALUES (
  '기본템플릿',
  '기본 송장 양식',
  '[
    {"order": 1, "header_name": "주문번호", "field_type": "db", "db_field": "order_number", "fixed_value": "", "transform": null, "width": 20, "headerColor": "#4472C4", "alignment": "center"},
    {"order": 2, "header_name": "수취인", "field_type": "db", "db_field": "recipient_name", "fixed_value": "", "transform": null, "width": 15, "headerColor": "#4472C4", "alignment": "center"},
    {"order": 3, "header_name": "전화번호", "field_type": "db", "db_field": "recipient_phone", "fixed_value": "", "transform": null, "width": 15, "headerColor": "#4472C4", "alignment": "center"},
    {"order": 4, "header_name": "주소", "field_type": "db", "db_field": "recipient_address", "fixed_value": "", "transform": null, "width": 30, "headerColor": "#4472C4", "alignment": "left"},
    {"order": 5, "header_name": "택배사", "field_type": "db", "db_field": "courier_company", "fixed_value": "", "transform": null, "width": 15, "headerColor": "#4472C4", "alignment": "center"},
    {"order": 6, "header_name": "송장번호", "field_type": "db", "db_field": "tracking_number", "fixed_value": "", "transform": null, "width": 20, "headerColor": "#4472C4", "alignment": "center"}
  ]'::jsonb
)
ON CONFLICT (market_name) DO NOTHING;

COMMENT ON TABLE market_invoice_templates IS '마켓별 송장파일 엑셀 양식 설정';
COMMENT ON COLUMN market_invoice_templates.market_name IS '마켓명 (예: 쿠팡, 네이버)';
COMMENT ON COLUMN market_invoice_templates.template_name IS '템플릿 이름';
COMMENT ON COLUMN market_invoice_templates.columns IS '컬럼 매핑 정보 (JSON 배열)';
COMMENT ON COLUMN market_invoice_templates.is_active IS '활성화 여부';
