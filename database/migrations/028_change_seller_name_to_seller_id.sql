-- =====================================================
-- integrated_orders의 seller_name을 seller_id로 변경
-- =====================================================
-- 작성일: 2025-10-11
-- 설명: seller_name(VARCHAR)을 seller_id(UUID)로 변경하여 users 테이블과 Foreign Key 관계 설정
--       mapping_settings_standard_fields의 seller_name 표준 필드를 유지하면서 정규화
-- =====================================================

-- 0-1. 뷰 먼저 삭제 (seller_id를 참조하고 있음)
DROP VIEW IF EXISTS direct_sales_orders;
DROP VIEW IF EXISTS seller_orders;

-- 0-2. 테스트 환경이므로 기존 데이터 삭제
TRUNCATE TABLE integrated_orders;

-- 0-3. 기존에 추가된 seller_id가 있다면 삭제 (025 마이그레이션에서 추가된 것)
ALTER TABLE integrated_orders
DROP COLUMN IF EXISTS seller_id;

-- 1. seller_name 컬럼을 seller_id로 이름 변경
ALTER TABLE integrated_orders
RENAME COLUMN seller_name TO seller_id;

-- 2. 타입을 VARCHAR에서 UUID로 변경
ALTER TABLE integrated_orders
ALTER COLUMN seller_id TYPE UUID USING seller_id::uuid;

-- 3. Foreign Key 제약조건 추가
ALTER TABLE integrated_orders
ADD CONSTRAINT fk_integrated_orders_seller
FOREIGN KEY (seller_id) REFERENCES auth.users(id);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_integrated_orders_seller_id
ON integrated_orders(seller_id);

-- 5. 코멘트 업데이트
COMMENT ON COLUMN integrated_orders.seller_id IS '셀러 ID (users.id 참조, 표준필드명: seller_name)';

-- 6. 뷰 다시 생성
CREATE OR REPLACE VIEW direct_sales_orders AS
SELECT * FROM integrated_orders
WHERE seller_id IS NULL;

COMMENT ON VIEW direct_sales_orders IS '직판 주문만 조회하는 뷰';

CREATE OR REPLACE VIEW seller_orders AS
SELECT * FROM integrated_orders
WHERE seller_id IS NOT NULL;

COMMENT ON VIEW seller_orders IS 'B2B 셀러 주문만 조회하는 뷰';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders.seller_name → seller_id 변경 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'seller_id는 users.id를 참조하는 Foreign Key';
  RAISE NOTICE 'UI에서는 JOIN으로 users.company_name 표시';
  RAISE NOTICE '=================================================';
END $$;
