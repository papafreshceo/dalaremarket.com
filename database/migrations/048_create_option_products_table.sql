-- =====================================================
-- option_products 테이블 생성
-- =====================================================
-- 작성일: 2025-10-15
-- 설명: 옵션 상품 정보 관리 테이블 (옵션명 기반 자동 매핑용)
-- =====================================================

-- 기존 테이블이 있으면 삭제하지 않고, 없으면 생성
CREATE TABLE IF NOT EXISTS option_products (
  -- 기본 키
  id BIGSERIAL PRIMARY KEY,

  -- 옵션명 (고유 키)
  option_name VARCHAR(200) UNIQUE NOT NULL,

  -- 자동 매핑 필드
  seller_supply_price NUMERIC,           -- 셀러 공급가
  출고 VARCHAR(100),                     -- 출고 정보 (당일출고, 익일출고 등)
  송장 VARCHAR(100),                     -- 송장 담당 (로젠택배, CJ대한통운 등)
  벤더사 VARCHAR(100),                   -- 벤더사명
  발송지명 VARCHAR(100),                 -- 발송지명 (서울창고, 경기창고 등)
  발송지주소 TEXT,                       -- 발송지 주소
  발송지연락처 VARCHAR(50),              -- 발송지 연락처
  출고비용 NUMERIC,                      -- 출고비용 (shipping_cost와 동일)
  shipping_cost NUMERIC,                 -- 상품출고비용 (출고비용과 동일, 기존 호환성)

  -- 상태 관리
  status VARCHAR(50) DEFAULT '공급중',   -- 상태 (공급중, 품절, 일시중단 등)

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_option_products_option_name ON option_products(option_name);
CREATE INDEX IF NOT EXISTS idx_option_products_status ON option_products(status);
CREATE INDEX IF NOT EXISTS idx_option_products_벤더사 ON option_products(벤더사);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_option_products_updated_at ON option_products;
CREATE TRIGGER trigger_update_option_products_updated_at
  BEFORE UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE option_products IS '옵션 상품 정보 테이블 - 옵션명 기반 자동 매핑';
COMMENT ON COLUMN option_products.option_name IS '옵션명 (고유 키, integrated_orders.option_name과 매칭)';
COMMENT ON COLUMN option_products.seller_supply_price IS '셀러 공급가';
COMMENT ON COLUMN option_products.출고 IS '출고 정보 (당일출고, 익일출고 등)';
COMMENT ON COLUMN option_products.송장 IS '송장 담당 택배사';
COMMENT ON COLUMN option_products.벤더사 IS '벤더사명';
COMMENT ON COLUMN option_products.발송지명 IS '발송지명';
COMMENT ON COLUMN option_products.발송지주소 IS '발송지 주소';
COMMENT ON COLUMN option_products.발송지연락처 IS '발송지 연락처';
COMMENT ON COLUMN option_products.출고비용 IS '출고비용';
COMMENT ON COLUMN option_products.shipping_cost IS '상품출고비용 (출고비용과 동일)';
COMMENT ON COLUMN option_products.status IS '상태 (공급중, 품절, 일시중단 등)';

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'option_products 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '옵션명 기반 자동 매핑을 위한 테이블';
  RAISE NOTICE 'UNIQUE 제약: option_name';
  RAISE NOTICE '=================================================';
END $$;
