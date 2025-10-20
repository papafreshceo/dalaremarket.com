-- 품목 마스터 테이블 생성
CREATE TABLE IF NOT EXISTS products_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 카테고리 계층
  category_1 VARCHAR(100),  -- 대분류
  category_2 VARCHAR(100),  -- 중분류
  category_3 VARCHAR(100),  -- 소분류
  category_4 VARCHAR(100),  -- 품목
  category_4_code VARCHAR(50),  -- 품목코드

  -- 품목 속성
  raw_material_status VARCHAR(50),  -- 원물상태
  shipping_deadline INTEGER,  -- 발송기한 (일 단위)
  season_start_date VARCHAR(5),  -- 시즌 시작일 (MM-DD)
  season_end_date VARCHAR(5),  -- 시즌 종료일 (MM-DD)

  -- 셀러 공급 정보
  seller_supply BOOLEAN DEFAULT true,  -- 셀러공급 여부

  -- 배지/태그
  is_best BOOLEAN DEFAULT false,  -- 베스트 상품
  is_recommended BOOLEAN DEFAULT false,  -- 추천 상품
  has_image BOOLEAN DEFAULT false,  -- 이미지 제공
  has_detail_page BOOLEAN DEFAULT false,  -- 상세페이지

  -- 메타데이터
  notes TEXT,  -- 비고
  is_active BOOLEAN DEFAULT true,  -- 활성화 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유니크 제약조건 (카테고리 조합이 중복되지 않도록)
  CONSTRAINT unique_category_combination UNIQUE (category_1, category_2, category_3, category_4)
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_products_master_category_1 ON products_master(category_1);
CREATE INDEX idx_products_master_category_2 ON products_master(category_2);
CREATE INDEX idx_products_master_category_3 ON products_master(category_3);
CREATE INDEX idx_products_master_category_4 ON products_master(category_4);
CREATE INDEX idx_products_master_active ON products_master(is_active);
CREATE INDEX idx_products_master_seller_supply ON products_master(seller_supply);

-- 컬럼 설명 추가
COMMENT ON TABLE products_master IS '농산물 품목 마스터 테이블 (사입 상품 전용)';
COMMENT ON COLUMN products_master.category_1 IS '대분류';
COMMENT ON COLUMN products_master.category_2 IS '중분류';
COMMENT ON COLUMN products_master.category_3 IS '소분류';
COMMENT ON COLUMN products_master.category_4 IS '품목';
COMMENT ON COLUMN products_master.category_4_code IS '품목코드';
COMMENT ON COLUMN products_master.raw_material_status IS '원물상태 (예: 상, 중, 하)';
COMMENT ON COLUMN products_master.shipping_deadline IS '발송기한 (일 단위)';
COMMENT ON COLUMN products_master.season_start_date IS '시즌 시작일 (MM-DD 형식)';
COMMENT ON COLUMN products_master.season_end_date IS '시즌 종료일 (MM-DD 형식)';
COMMENT ON COLUMN products_master.seller_supply IS '셀러공급 여부';
COMMENT ON COLUMN products_master.is_best IS '베스트 상품 표시';
COMMENT ON COLUMN products_master.is_recommended IS '추천 상품 표시';
COMMENT ON COLUMN products_master.has_image IS '이미지 제공 여부';
COMMENT ON COLUMN products_master.has_detail_page IS '상세페이지 제공 여부';

-- Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_products_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_master_updated_at
  BEFORE UPDATE ON products_master
  FOR EACH ROW
  EXECUTE FUNCTION update_products_master_updated_at();
