-- =====================================================
-- 옵션 상품 가격 이력 테이블 생성
-- =====================================================
-- 작성일: 2025-01-16
-- 설명: 옵션 상품의 셀러 공급가 변동 이력 추적
-- =====================================================

-- 기존 테이블이 있으면 삭제
DROP TABLE IF EXISTS option_product_price_history CASCADE;

-- 옵션 상품 가격 이력 테이블 생성
CREATE TABLE option_product_price_history (
  id SERIAL PRIMARY KEY,
  option_product_id INTEGER NOT NULL REFERENCES option_products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  change_reason TEXT,
  changed_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_option_product FOREIGN KEY (option_product_id) REFERENCES option_products(id)
);

-- 인덱스 생성
CREATE INDEX idx_price_history_product_id ON option_product_price_history(option_product_id);
CREATE INDEX idx_price_history_created_at ON option_product_price_history(created_at);
CREATE INDEX idx_price_history_product_date ON option_product_price_history(option_product_id, created_at);

-- RLS 활성화
ALTER TABLE option_product_price_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자는 모두 조회 가능
CREATE POLICY "Anyone can view price history"
  ON option_product_price_history
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS 정책: 관리자만 추가/수정 가능
CREATE POLICY "Admins can insert price history"
  ON option_product_price_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '옵션 상품 가격 이력 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '테이블: option_product_price_history';
  RAISE NOTICE '기능: 셀러 공급가 변동 추적';
  RAISE NOTICE '=================================================';
END $$;
