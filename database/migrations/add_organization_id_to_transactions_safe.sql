-- =====================================================
-- cash_transactions / credits_transactions 테이블에 organization_id 추가
-- 존재하는 테이블만 안전하게 처리
-- =====================================================

-- 1. cash_transactions 테이블 처리
DO $$
BEGIN
  -- 테이블이 존재하는지 먼저 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'cash_transactions'
  ) THEN
    -- organization_id 컬럼 추가
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'cash_transactions' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE cash_transactions ADD COLUMN organization_id UUID REFERENCES organizations(id);
      RAISE NOTICE '✅ cash_transactions에 organization_id 컬럼 추가됨';
    ELSE
      RAISE NOTICE '⚠️  cash_transactions에 organization_id 컬럼이 이미 존재함';
    END IF;

    -- 기존 트랜잭션에 organization_id 매핑
    UPDATE cash_transactions
    SET organization_id = u.primary_organization_id
    FROM users u
    WHERE cash_transactions.user_id = u.id
      AND cash_transactions.organization_id IS NULL
      AND u.primary_organization_id IS NOT NULL;

    RAISE NOTICE '✅ cash_transactions organization_id 매핑 완료';
  ELSE
    RAISE NOTICE '⚠️  cash_transactions 테이블이 존재하지 않음 - 스킵';
  END IF;
END $$;

-- 2. credits_transactions 테이블 처리
DO $$
BEGIN
  -- 테이블이 존재하는지 먼저 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'credits_transactions'
  ) THEN
    -- organization_id 컬럼 추가
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'credits_transactions' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE credits_transactions ADD COLUMN organization_id UUID REFERENCES organizations(id);
      RAISE NOTICE '✅ credits_transactions에 organization_id 컬럼 추가됨';
    ELSE
      RAISE NOTICE '⚠️  credits_transactions에 organization_id 컬럼이 이미 존재함';
    END IF;

    -- 기존 트랜잭션에 organization_id 매핑
    UPDATE credits_transactions
    SET organization_id = u.primary_organization_id
    FROM users u
    WHERE credits_transactions.user_id = u.id
      AND credits_transactions.organization_id IS NULL
      AND u.primary_organization_id IS NOT NULL;

    RAISE NOTICE '✅ credits_transactions organization_id 매핑 완료';
  ELSE
    RAISE NOTICE '⚠️  credits_transactions 테이블이 존재하지 않음 - 스킵';
  END IF;
END $$;

-- 완료 메시지
DO $$
DECLARE
  v_cash_count INTEGER := 0;
  v_credits_count INTEGER := 0;
BEGIN
  -- cash_transactions 카운트
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_transactions') THEN
    SELECT COUNT(*) INTO v_cash_count
    FROM cash_transactions
    WHERE organization_id IS NOT NULL;
  END IF;

  -- credits_transactions 카운트
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credits_transactions') THEN
    SELECT COUNT(*) INTO v_credits_count
    FROM credits_transactions
    WHERE organization_id IS NOT NULL;
  END IF;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ transactions organization_id 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'cash_transactions 업데이트: % 건', v_cash_count;
  RAISE NOTICE 'credits_transactions 업데이트: % 건', v_credits_count;
  RAISE NOTICE '=================================================';
END $$;
