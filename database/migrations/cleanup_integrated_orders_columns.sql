-- =====================================================
-- integrated_orders 테이블 정리 마이그레이션
-- =====================================================
-- 목적:
--   1. created_by 컬럼 활성화 (등록자 추적)
--   2. seller_id 컬럼 제거 (organization_id와 중복)
--   3. 명확한 단일 데이터 모델 구축
-- =====================================================

-- 1단계: 기존 데이터 백업
-- seller_id 데이터를 organization_id로 마이그레이션
UPDATE integrated_orders
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE users.id = integrated_orders.seller_id
)
WHERE organization_id IS NULL
  AND seller_id IS NOT NULL;

-- 2단계: created_by 기본값 설정 (기존 레코드)
-- 기존 레코드의 created_by를 organization의 owner로 설정
UPDATE integrated_orders
SET created_by = (
  SELECT owner_id
  FROM organizations
  WHERE organizations.id = integrated_orders.organization_id
)
WHERE created_by IS NULL
  AND organization_id IS NOT NULL;

-- 3단계: 의존 View들을 organization_id 기반으로 재생성
-- 기존 View 삭제
DROP VIEW IF EXISTS direct_sales_orders;
DROP VIEW IF EXISTS seller_orders;

-- direct_sales_orders: 조직이 없는 주문 (레거시 직판)
CREATE OR REPLACE VIEW direct_sales_orders AS
SELECT * FROM integrated_orders
WHERE organization_id IS NULL;

COMMENT ON VIEW direct_sales_orders IS '조직이 없는 직판 주문만 조회하는 뷰';

-- seller_orders: 조직이 있는 주문 (B2B 셀러)
CREATE OR REPLACE VIEW seller_orders AS
SELECT * FROM integrated_orders
WHERE organization_id IS NOT NULL;

COMMENT ON VIEW seller_orders IS '조직에 속한 셀러 주문만 조회하는 뷰';

-- 4단계: seller_id 컬럼 제거
-- Foreign Key 제약조건 먼저 제거
ALTER TABLE integrated_orders
DROP CONSTRAINT IF EXISTS fk_integrated_orders_seller;

-- seller_id 인덱스 제거
DROP INDEX IF EXISTS idx_integrated_orders_seller_id;

-- seller_id 컬럼 제거
ALTER TABLE integrated_orders
DROP COLUMN IF EXISTS seller_id;

-- 5단계: created_by 컬럼 제약조건 강화
-- NOT NULL 제약 추가 (향후 레코드는 필수)
-- 주의: 기존 데이터에 NULL이 있을 수 있으므로, 위에서 먼저 채워야 함
ALTER TABLE integrated_orders
ALTER COLUMN created_by SET NOT NULL;

-- created_by 인덱스 추가 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_created_by
ON integrated_orders(created_by);

-- 6단계: organization_id 제약조건 강화
-- NOT NULL 제약 추가 (모든 주문은 조직에 속해야 함)
ALTER TABLE integrated_orders
ALTER COLUMN organization_id SET NOT NULL;

-- 7단계: 코멘트 업데이트
COMMENT ON COLUMN integrated_orders.created_by IS '주문을 등록한 사용자 (audit trail)';
COMMENT ON COLUMN integrated_orders.organization_id IS '주문이 속한 조직 (데이터 필터링 기준)';

-- 8단계: 검증 쿼리
DO $$
DECLARE
  null_created_by_count INT;
  null_org_id_count INT;
BEGIN
  SELECT COUNT(*) INTO null_created_by_count
  FROM integrated_orders
  WHERE created_by IS NULL;

  SELECT COUNT(*) INTO null_org_id_count
  FROM integrated_orders
  WHERE organization_id IS NULL;

  IF null_created_by_count > 0 THEN
    RAISE WARNING 'created_by가 NULL인 레코드가 % 개 있습니다.', null_created_by_count;
  END IF;

  IF null_org_id_count > 0 THEN
    RAISE WARNING 'organization_id가 NULL인 레코드가 % 개 있습니다.', null_org_id_count;
  END IF;

  RAISE NOTICE '마이그레이션 완료: seller_id 제거, created_by 및 organization_id 필수화';
END $$;
