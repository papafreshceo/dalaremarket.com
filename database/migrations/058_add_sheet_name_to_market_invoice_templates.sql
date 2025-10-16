-- market_invoice_templates 테이블에 sheet_name 컬럼 추가
-- 엑셀 다운로드 시 시트명을 마켓별로 설정할 수 있도록 함

-- sheet_name 컬럼 추가
ALTER TABLE market_invoice_templates
ADD COLUMN IF NOT EXISTS sheet_name VARCHAR(100);

-- 기본값 설정 (기존 데이터: 마켓명을 시트명으로 사용)
UPDATE market_invoice_templates
SET sheet_name = market_name
WHERE sheet_name IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN market_invoice_templates.sheet_name IS '엑셀 다운로드 시 사용할 시트명';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'market_invoice_templates 테이블에 sheet_name 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
END $$;
