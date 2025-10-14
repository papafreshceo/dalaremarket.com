-- 벤더사별 엑셀 양식 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS vendor_export_templates (
  id SERIAL PRIMARY KEY,
  vendor_name VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(200),
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vendor_export_templates_vendor_name ON vendor_export_templates(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_export_templates_is_active ON vendor_export_templates(is_active);

-- 코멘트 추가
COMMENT ON TABLE vendor_export_templates IS '벤더사별 엑셀 양식 템플릿';
COMMENT ON COLUMN vendor_export_templates.vendor_name IS '벤더사명 (unique)';
COMMENT ON COLUMN vendor_export_templates.template_name IS '템플릿 이름';
COMMENT ON COLUMN vendor_export_templates.columns IS '컬럼 매핑 정보 JSON 배열: [{"order": 1, "header_name": "주문번호", "db_field": "order_number", "transform": null}]';
COMMENT ON COLUMN vendor_export_templates.is_active IS '활성화 여부';

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_vendor_export_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vendor_export_templates_updated_at ON vendor_export_templates;

CREATE TRIGGER trigger_update_vendor_export_templates_updated_at
  BEFORE UPDATE ON vendor_export_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_export_templates_updated_at();

-- 기본 템플릿 예시 데이터 (선택사항)
INSERT INTO vendor_export_templates (vendor_name, template_name, columns) VALUES
('기본템플릿', '기본 발송 양식', '[
  {"order": 1, "header_name": "주문번호", "field_type": "db", "db_field": "order_number", "transform": null},
  {"order": 2, "header_name": "수취인", "field_type": "db", "db_field": "recipient_name", "transform": null},
  {"order": 3, "header_name": "전화번호", "field_type": "db", "db_field": "recipient_phone", "transform": null},
  {"order": 4, "header_name": "주소", "field_type": "db", "db_field": "recipient_address", "transform": null},
  {"order": 5, "header_name": "옵션명", "field_type": "db", "db_field": "option_name", "transform": null},
  {"order": 6, "header_name": "수량", "field_type": "db", "db_field": "quantity", "transform": null},
  {"order": 7, "header_name": "택배사", "field_type": "db", "db_field": "courier_company", "transform": null},
  {"order": 8, "header_name": "송장번호", "field_type": "db", "db_field": "tracking_number", "transform": null}
]'::jsonb)
ON CONFLICT (vendor_name) DO NOTHING;
