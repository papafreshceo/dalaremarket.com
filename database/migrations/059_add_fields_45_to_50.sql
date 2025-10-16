-- mapping_settings_standard_fields 테이블에 field_45 ~ field_50 추가
-- 표준필드 확장 (묶음배송번호 등 추가 필드용)

ALTER TABLE mapping_settings_standard_fields
ADD COLUMN IF NOT EXISTS field_45 TEXT,
ADD COLUMN IF NOT EXISTS field_46 TEXT,
ADD COLUMN IF NOT EXISTS field_47 TEXT,
ADD COLUMN IF NOT EXISTS field_48 TEXT,
ADD COLUMN IF NOT EXISTS field_49 TEXT,
ADD COLUMN IF NOT EXISTS field_50 TEXT;

-- 코멘트 추가
COMMENT ON COLUMN mapping_settings_standard_fields.field_45 IS '표준필드 45 (예: 묶음배송번호)';
COMMENT ON COLUMN mapping_settings_standard_fields.field_46 IS '표준필드 46';
COMMENT ON COLUMN mapping_settings_standard_fields.field_47 IS '표준필드 47';
COMMENT ON COLUMN mapping_settings_standard_fields.field_48 IS '표준필드 48';
COMMENT ON COLUMN mapping_settings_standard_fields.field_49 IS '표준필드 49';
COMMENT ON COLUMN mapping_settings_standard_fields.field_50 IS '표준필드 50';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'mapping_settings_standard_fields 테이블에 field_45~50 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
END $$;
