-- =====================================================
-- transaction_statements.seller_id 컬럼명 변경
-- =====================================================
-- 작성일: 2025-01-16
-- 설명:
--   seller_id → platform_admin_id로 변경
--   (우리 회사 관리자 ID를 명확히 표시)
-- =====================================================

DO $$
BEGIN
  -- seller_id 컬럼명을 platform_admin_id로 변경
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_statements' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE transaction_statements
    RENAME COLUMN seller_id TO platform_admin_id;

    RAISE NOTICE 'seller_id → platform_admin_id 변경 완료';
  END IF;

  -- buyer_id는 레거시 호환성을 위해 유지 (NULL 가능)
  -- 새 시스템에서는 buyer_sub_account_id 사용

END $$;

-- 인덱스 재생성
DROP INDEX IF EXISTS idx_statements_seller;
CREATE INDEX IF NOT EXISTS idx_statements_platform_admin
ON transaction_statements(platform_admin_id);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'transaction_statements 컬럼명 변경 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '  - seller_id → platform_admin_id';
  RAISE NOTICE '    (우리 회사 관리자/발급자 ID)';
  RAISE NOTICE '';
  RAISE NOTICE '명확한 의미:';
  RAISE NOTICE '  - platform_admin_id: 거래명세서 발급한 관리자';
  RAISE NOTICE '  - buyer_sub_account_id: 상품 구매한 서브계정';
  RAISE NOTICE '========================================';
END $$;
