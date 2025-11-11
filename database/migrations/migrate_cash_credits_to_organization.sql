-- =====================================================
-- 캐시/크레딧을 조직 기반으로 통합
-- =====================================================
-- 작성일: 2025-11-11
-- 목적: 개인별 캐시/크레딧을 조직별로 통합
-- =====================================================

-- 1. 기존 user_cash 테이블에 organization_id 추가 (이미 있을 수 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cash' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE user_cash ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- 2. 기존 user_credits 테이블에 organization_id 추가 (이미 있을 수 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_credits' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE user_credits ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- 3. 기존 데이터에 organization_id 매핑
UPDATE user_cash
SET organization_id = u.primary_organization_id
FROM users u
WHERE user_cash.user_id = u.id
  AND user_cash.organization_id IS NULL
  AND u.primary_organization_id IS NOT NULL;

UPDATE user_credits
SET organization_id = u.primary_organization_id
FROM users u
WHERE user_credits.user_id = u.id
  AND user_credits.organization_id IS NULL
  AND u.primary_organization_id IS NOT NULL;

-- 4. user_cash의 기존 UNIQUE 제약 조건 제거 및 새로운 제약 조건 추가
DO $$
BEGIN
  -- 기존 user_id UNIQUE 제약 조건 제거
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_cash_user_id_key'
  ) THEN
    ALTER TABLE user_cash DROP CONSTRAINT user_cash_user_id_key;
  END IF;

  -- organization_id 기반 UNIQUE 제약 조건 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_cash_organization_id_key'
  ) THEN
    ALTER TABLE user_cash ADD CONSTRAINT user_cash_organization_id_key UNIQUE (organization_id);
  END IF;
END $$;

-- 5. user_credits의 기존 UNIQUE 제약 조건 제거 및 새로운 제약 조건 추가
DO $$
BEGIN
  -- 기존 user_id UNIQUE 제약 조건 제거
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_credits_user_id_key'
  ) THEN
    ALTER TABLE user_credits DROP CONSTRAINT user_credits_user_id_key;
  END IF;

  -- organization_id 기반 UNIQUE 제약 조건 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_credits_organization_id_key'
  ) THEN
    ALTER TABLE user_credits ADD CONSTRAINT user_credits_organization_id_key UNIQUE (organization_id);
  END IF;
END $$;

-- 6. 같은 조직에 속한 여러 user_id의 캐시/크레딧 합산 및 중복 제거
-- 각 조직당 하나의 레코드만 남기고 나머지는 삭제
WITH ranked_cash AS (
  SELECT
    id,
    organization_id,
    ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC) as rn,
    SUM(balance) OVER (PARTITION BY organization_id) as total_balance
  FROM user_cash
  WHERE organization_id IS NOT NULL
)
UPDATE user_cash
SET balance = ranked_cash.total_balance
FROM ranked_cash
WHERE user_cash.id = ranked_cash.id
  AND ranked_cash.rn = 1;

-- 중복 레코드 삭제 (각 조직의 첫 번째 레코드만 남김)
DELETE FROM user_cash
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC) as rn
    FROM user_cash
    WHERE organization_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- 크레딧도 동일하게 처리
WITH ranked_credits AS (
  SELECT
    id,
    organization_id,
    ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC) as rn,
    SUM(balance) OVER (PARTITION BY organization_id) as total_balance
  FROM user_credits
  WHERE organization_id IS NOT NULL
)
UPDATE user_credits
SET balance = ranked_credits.total_balance
FROM ranked_credits
WHERE user_credits.id = ranked_credits.id
  AND ranked_credits.rn = 1;

-- 중복 레코드 삭제
DELETE FROM user_credits
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC) as rn
    FROM user_credits
    WHERE organization_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- 7. user_credit_transactions 테이블에 organization_id 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_credit_transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE user_credit_transactions ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- 8. 기존 트랜잭션에 organization_id 매핑
UPDATE user_credit_transactions
SET organization_id = u.primary_organization_id
FROM users u
WHERE user_credit_transactions.user_id = u.id
  AND user_credit_transactions.organization_id IS NULL
  AND u.primary_organization_id IS NOT NULL;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 캐시/크레딧 조직 기반 통합 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. user_cash/user_credits에 organization_id 컬럼 추가';
  RAISE NOTICE '2. 기존 데이터에 organization_id 매핑';
  RAISE NOTICE '3. UNIQUE 제약 조건을 user_id에서 organization_id로 변경';
  RAISE NOTICE '4. 같은 조직의 캐시/크레딧 합산 및 중복 제거';
  RAISE NOTICE '5. user_credit_transactions 테이블에도 organization_id 추가';
  RAISE NOTICE '=================================================';
END $$;
