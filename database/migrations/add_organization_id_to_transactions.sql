-- =====================================================
-- user_cash_transactions 테이블에 organization_id 추가
-- =====================================================

-- user_cash_transactions 테이블에 organization_id 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cash_transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE user_cash_transactions ADD COLUMN organization_id UUID REFERENCES organizations(id);
    RAISE NOTICE '✅ user_cash_transactions에 organization_id 컬럼 추가됨';
  ELSE
    RAISE NOTICE '⚠️  user_cash_transactions에 organization_id 컬럼이 이미 존재함';
  END IF;
END $$;

-- 기존 트랜잭션에 organization_id 매핑
UPDATE user_cash_transactions
SET organization_id = u.primary_organization_id
FROM users u
WHERE user_cash_transactions.user_id = u.id
  AND user_cash_transactions.organization_id IS NULL
  AND u.primary_organization_id IS NOT NULL;

-- 완료 메시지
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM user_cash_transactions
  WHERE organization_id IS NOT NULL;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ user_cash_transactions organization_id 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '업데이트된 레코드 수: %', v_updated_count;
  RAISE NOTICE '=================================================';
END $$;
