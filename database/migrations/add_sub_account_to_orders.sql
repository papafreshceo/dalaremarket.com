-- =====================================================
-- integrated_orders에 sub_account_id 컬럼 추가
-- =====================================================
-- 작성일: 2025-11-13
-- 설명:
--   - 발주서에 사용된 사업자 정보(서브 계정) 연결
--   - NULL이면 메인 계정의 기본 사업자 정보 사용
--   - NULL이 아니면 해당 서브 계정의 사업자 정보 사용
-- =====================================================

-- 1. sub_account_id 컬럼 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_integrated_orders_sub_account_id
ON integrated_orders(sub_account_id);

-- 3. 코멘트 추가
COMMENT ON COLUMN integrated_orders.sub_account_id IS '정산용 사업자 정보 (NULL이면 메인 계정 기본 사업자 사용)';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ integrated_orders.sub_account_id 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '사용법:';
  RAISE NOTICE '- sub_account_id = NULL: 메인 계정 기본 사업자 정보';
  RAISE NOTICE '- sub_account_id = [UUID]: 해당 서브 계정 사업자 정보';
  RAISE NOTICE '=================================================';
END $$;
