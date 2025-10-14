-- =====================================================
-- 택배사 양식 템플릿 테이블 생성
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: 택배사별 엑셀 양식 컬럼 매핑 설정 (벤더사 양식과 동일한 방식)
-- =====================================================

-- 1단계: 테이블이 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courier_templates') THEN
    CREATE TABLE courier_templates (
      id SERIAL PRIMARY KEY,
      courier_name VARCHAR(100) UNIQUE NOT NULL,
      template_name VARCHAR(200),
      columns JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE '택배사 템플릿 테이블 생성 완료';
  ELSE
    RAISE NOTICE '택배사 템플릿 테이블이 이미 존재합니다';
  END IF;
END $$;

-- 2단계: 필요한 컬럼들이 없으면 추가
DO $$
BEGIN
  -- template_name 컬럼 확인 및 추가
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'courier_templates'
    AND column_name = 'template_name'
  ) THEN
    ALTER TABLE courier_templates ADD COLUMN template_name VARCHAR(200);
    RAISE NOTICE 'template_name 컬럼 추가 완료';
  END IF;

  -- columns 컬럼 확인 및 추가
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'courier_templates'
    AND column_name = 'columns'
  ) THEN
    ALTER TABLE courier_templates ADD COLUMN columns JSONB NOT NULL DEFAULT '[]'::jsonb;
    RAISE NOTICE 'columns 컬럼 추가 완료';
  END IF;

  -- is_active 컬럼 확인 및 추가
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'courier_templates'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE courier_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'is_active 컬럼 추가 완료';
  END IF;

  -- created_at 컬럼 확인 및 추가
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'courier_templates'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE courier_templates ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'created_at 컬럼 추가 완료';
  END IF;

  -- updated_at 컬럼 확인 및 추가
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'courier_templates'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE courier_templates ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'updated_at 컬럼 추가 완료';
  END IF;

  -- field_mapping 컬럼이 있으면 NOT NULL 제약조건 제거
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'courier_templates'
    AND column_name = 'field_mapping'
  ) THEN
    ALTER TABLE courier_templates ALTER COLUMN field_mapping DROP NOT NULL;
    ALTER TABLE courier_templates ALTER COLUMN field_mapping SET DEFAULT '[]'::jsonb;
    RAISE NOTICE 'field_mapping NOT NULL 제약조건 제거 완료';
  END IF;
END $$;

-- 3단계: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_courier_templates_courier_name ON courier_templates(courier_name);
CREATE INDEX IF NOT EXISTS idx_courier_templates_is_active ON courier_templates(is_active);

-- 4단계: updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_courier_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5단계: 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_courier_templates_updated_at ON courier_templates;

CREATE TRIGGER trigger_update_courier_templates_updated_at
  BEFORE UPDATE ON courier_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_courier_templates_updated_at();

-- 6단계: 기본 템플릿 데이터 삽입
INSERT INTO courier_templates (courier_name, template_name, columns) VALUES
('기본템플릿', '기본 송장 양식', '[
  {"order": 1, "header_name": "주문번호", "field_type": "db", "db_field": "order_number"},
  {"order": 2, "header_name": "택배사", "field_type": "db", "db_field": "courier_company"},
  {"order": 3, "header_name": "송장번호", "field_type": "db", "db_field": "tracking_number"}
]'::jsonb),
('CJ대한통운', 'CJ대한통운 송장 양식', '[
  {"order": 1, "header_name": "주문번호", "field_type": "db", "db_field": "order_number"},
  {"order": 2, "header_name": "택배사", "field_type": "db", "db_field": "courier_company"},
  {"order": 3, "header_name": "운송장번호", "field_type": "db", "db_field": "tracking_number"}
]'::jsonb)
ON CONFLICT (courier_name) DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '택배사 양식 템플릿 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '테이블: courier_templates';
  RAISE NOTICE '기본 템플릿 생성됨';
  RAISE NOTICE '=================================================';
END $$;
