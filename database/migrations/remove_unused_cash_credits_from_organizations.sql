-- =====================================================
-- organizations 테이블에서 사용하지 않는 cash, credits 칼럼 제거
-- =====================================================
-- 작성일: 2025-01-15
-- 설명: organization_cash, organization_credits 테이블로 완전 이전 완료
--       organizations.cash, organizations.credits 칼럼은 더 이상 사용되지 않음
-- =====================================================

-- =====================================================
-- 1. 현재 상태 확인
-- =====================================================

-- 칼럼 존재 여부 확인
DO $$
DECLARE
  cash_column_exists BOOLEAN;
  credits_column_exists BOOLEAN;
BEGIN
  -- organizations.cash 칼럼 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'cash'
  ) INTO cash_column_exists;

  -- organizations.credits 칼럼 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'credits'
  ) INTO credits_column_exists;

  IF cash_column_exists THEN
    RAISE NOTICE 'ℹ️  organizations.cash 칼럼 발견 - 삭제 예정';
  ELSE
    RAISE NOTICE '✅ organizations.cash 칼럼이 이미 존재하지 않음';
  END IF;

  IF credits_column_exists THEN
    RAISE NOTICE 'ℹ️  organizations.credits 칼럼 발견 - 삭제 예정';
  ELSE
    RAISE NOTICE '✅ organizations.credits 칼럼이 이미 존재하지 않음';
  END IF;
END $$;

-- =====================================================
-- 2. 칼럼 존재 확인 후 삭제
-- =====================================================

-- organizations.cash 칼럼 삭제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'cash'
  ) THEN
    ALTER TABLE organizations DROP COLUMN cash;
    RAISE NOTICE '✅ organizations.cash 칼럼 삭제 완료';
  ELSE
    RAISE NOTICE 'ℹ️  organizations.cash 칼럼이 이미 존재하지 않음';
  END IF;
END $$;

-- organizations.credits 칼럼 삭제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'credits'
  ) THEN
    ALTER TABLE organizations DROP COLUMN credits;
    RAISE NOTICE '✅ organizations.credits 칼럼 삭제 완료';
  ELSE
    RAISE NOTICE 'ℹ️  organizations.credits 칼럼이 이미 존재하지 않음';
  END IF;
END $$;

-- =====================================================
-- 3. 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations 테이블 정리 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '삭제된 칼럼:';
  RAISE NOTICE '  - organizations.cash (대체: organization_cash.balance)';
  RAISE NOTICE '  - organizations.credits (대체: organization_credits.balance)';
  RAISE NOTICE '';
  RAISE NOTICE '캐시/크레딧은 다음 테이블에서 관리됩니다:';
  RAISE NOTICE '  - organization_cash (캐시 잔액)';
  RAISE NOTICE '  - organization_credits (크레딧 잔액)';
  RAISE NOTICE '  - organization_cash_transactions (캐시 거래 내역)';
  RAISE NOTICE '  - organization_credit_transactions (크레딧 거래 내역)';
  RAISE NOTICE '  - organization_cash_history (캐시 히스토리)';
  RAISE NOTICE '  - organization_credits_history (크레딧 히스토리)';
  RAISE NOTICE '=================================================';
END $$;
