-- =====================================================
-- 캐시/크레딧 시스템을 개인 단위에서 조직 단위로 마이그레이션
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: user_id 기반 시스템을 organization_id 기반으로 전환
-- 주의: 테스트 환경용, 기존 데이터는 삭제됨
-- =====================================================

-- =====================================================
-- Step 1: organization_cash_history 테이블 수정
-- =====================================================

-- user_id 컬럼 삭제 (organization 단위 관리이므로 불필요)
ALTER TABLE organization_cash_history
DROP COLUMN IF EXISTS user_id;

-- =====================================================
-- Step 2: organization_credits_history 테이블 수정
-- =====================================================

-- user_id 컬럼 삭제 (organization 단위 관리이므로 불필요)
ALTER TABLE organization_credits_history
DROP COLUMN IF EXISTS user_id;

-- =====================================================
-- Step 3: organization_cash_transactions 테이블 수정
-- =====================================================

-- 3-0. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view their own cash transactions" ON organization_cash_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON organization_cash_transactions;

-- 3-1. organization_id 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_cash_transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE organization_cash_transactions ADD COLUMN organization_id uuid NULL;
  END IF;
END $$;

-- 3-2. used_by_user_id 컬럼 추가 (사용한 멤버 추적용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_cash_transactions' AND column_name = 'used_by_user_id'
  ) THEN
    ALTER TABLE organization_cash_transactions ADD COLUMN used_by_user_id uuid NULL;
  END IF;
END $$;

-- 3-3. 기존 user_id 데이터를 organization_id와 used_by_user_id로 마이그레이션
UPDATE organization_cash_transactions t
SET organization_id = u.primary_organization_id,
    used_by_user_id = t.user_id
FROM users u
WHERE t.user_id = u.id
AND t.organization_id IS NULL
AND u.primary_organization_id IS NOT NULL;

-- 3-3-1. organization_id가 여전히 NULL인 행 삭제 (primary_organization_id가 없는 경우)
DELETE FROM organization_cash_transactions
WHERE organization_id IS NULL;

-- 3-4. organization_id를 NOT NULL로 설정
ALTER TABLE organization_cash_transactions
ALTER COLUMN organization_id SET NOT NULL;

-- 3-5. organization_id 외래키 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_cash_transactions_organization_id_fkey'
  ) THEN
    ALTER TABLE organization_cash_transactions
    ADD CONSTRAINT organization_cash_transactions_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3-6. used_by_user_id 외래키 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_cash_transactions_used_by_user_id_fkey'
  ) THEN
    ALTER TABLE organization_cash_transactions
    ADD CONSTRAINT organization_cash_transactions_used_by_user_id_fkey
    FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3-7. user_id 컬럼 삭제 (CASCADE로 의존 객체도 함께 삭제)
ALTER TABLE organization_cash_transactions
DROP COLUMN IF EXISTS user_id CASCADE;

-- 3-8. 새로운 조직 기반 RLS 정책 추가
CREATE POLICY "Organization members can view their organization's cash transactions"
ON organization_cash_transactions
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can insert their organization's transactions"
ON organization_cash_transactions
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- Step 4: organization_credit_transactions 테이블 수정
-- =====================================================

-- 4-0. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON organization_credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON organization_credit_transactions;

-- 4-1. organization_id 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_credit_transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE organization_credit_transactions ADD COLUMN organization_id uuid NULL;
  END IF;
END $$;

-- 4-2. used_by_user_id 컬럼 추가 (사용한 멤버 추적용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_credit_transactions' AND column_name = 'used_by_user_id'
  ) THEN
    ALTER TABLE organization_credit_transactions ADD COLUMN used_by_user_id uuid NULL;
  END IF;
END $$;

-- 4-3. 기존 user_id 데이터를 organization_id와 used_by_user_id로 마이그레이션
UPDATE organization_credit_transactions t
SET organization_id = u.primary_organization_id,
    used_by_user_id = t.user_id
FROM users u
WHERE t.user_id = u.id
AND t.organization_id IS NULL
AND u.primary_organization_id IS NOT NULL;

-- 4-3-1. organization_id가 여전히 NULL인 행 삭제 (primary_organization_id가 없는 경우)
DELETE FROM organization_credit_transactions
WHERE organization_id IS NULL;

-- 4-4. organization_id를 NOT NULL로 설정
ALTER TABLE organization_credit_transactions
ALTER COLUMN organization_id SET NOT NULL;

-- 4-5. organization_id 외래키 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_credit_transactions_organization_id_fkey'
  ) THEN
    ALTER TABLE organization_credit_transactions
    ADD CONSTRAINT organization_credit_transactions_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4-6. used_by_user_id 외래키 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_credit_transactions_used_by_user_id_fkey'
  ) THEN
    ALTER TABLE organization_credit_transactions
    ADD CONSTRAINT organization_credit_transactions_used_by_user_id_fkey
    FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4-7. user_id 컬럼 삭제 (CASCADE로 의존 객체도 함께 삭제)
ALTER TABLE organization_credit_transactions
DROP COLUMN IF EXISTS user_id CASCADE;

-- 4-8. 새로운 조직 기반 RLS 정책 추가
CREATE POLICY "Organization members can view their organization's credit transactions"
ON organization_credit_transactions
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can insert their organization's credit transactions"
ON organization_credit_transactions
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- Step 5: organization_cash 테이블 수정
-- =====================================================

-- 5-0. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view their own cash balance" ON organization_cash;
DROP POLICY IF EXISTS "Users can update their own cash balance" ON organization_cash;
DROP POLICY IF EXISTS "Users can insert their own cash balance" ON organization_cash;
DROP POLICY IF EXISTS "Users can insert their own cash records" ON organization_cash;
DROP POLICY IF EXISTS "Users can view their own cash" ON organization_cash;
DROP POLICY IF EXISTS "Users can update their own cash" ON organization_cash;

-- 5-1. user_id 기반 외래키 제거
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_cash_user_id_fkey'
  ) THEN
    ALTER TABLE organization_cash DROP CONSTRAINT organization_cash_user_id_fkey;
  END IF;
END $$;

-- 5-2. user_id unique 제약조건 삭제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_cash_user_id_key'
  ) THEN
    ALTER TABLE organization_cash DROP CONSTRAINT organization_cash_user_id_key;
  END IF;
END $$;

-- 5-2-1. 기존 organization_id unique 제약조건도 삭제 (있다면)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_cash_organization_id_key'
  ) THEN
    ALTER TABLE organization_cash DROP CONSTRAINT user_cash_organization_id_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_cash_organization_id_key'
  ) THEN
    ALTER TABLE organization_cash DROP CONSTRAINT organization_cash_organization_id_key;
  END IF;
END $$;

-- 5-3. organization_id 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_cash' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE organization_cash ADD COLUMN organization_id uuid NULL;
  END IF;
END $$;

-- 5-4. 기존 user_id 데이터를 organization_id로 마이그레이션
UPDATE organization_cash c
SET organization_id = u.primary_organization_id
FROM users u
WHERE c.user_id = u.id
AND c.organization_id IS NULL
AND u.primary_organization_id IS NOT NULL;

-- 5-4-1. organization_id가 여전히 NULL인 행 삭제 (primary_organization_id가 없는 경우)
DELETE FROM organization_cash
WHERE organization_id IS NULL;

-- 5-4-2. 같은 organization_id를 가진 레코드들을 합산
-- 각 조직당 balance를 합산하여 가장 오래된 레코드에 저장
WITH ranked AS (
  SELECT
    id,
    organization_id,
    balance,
    ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC NULLS LAST, id::text) as rn
  FROM organization_cash
  WHERE organization_id IS NOT NULL
),
aggregated AS (
  SELECT
    organization_id,
    SUM(balance) as total_balance
  FROM organization_cash
  WHERE organization_id IS NOT NULL
  GROUP BY organization_id
)
UPDATE organization_cash c
SET balance = a.total_balance
FROM ranked r
INNER JOIN aggregated a ON r.organization_id = a.organization_id
WHERE c.id = r.id AND r.rn = 1;

-- 5-4-3. 중복 레코드 삭제 (각 조직의 첫 번째 레코드만 유지)
DELETE FROM organization_cash
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC NULLS LAST, id::text) as rn
    FROM organization_cash
    WHERE organization_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- 5-5. organization_id를 NOT NULL로 설정
ALTER TABLE organization_cash
ALTER COLUMN organization_id SET NOT NULL;

-- 5-6. organization_id unique 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_cash_organization_id_key'
  ) THEN
    ALTER TABLE organization_cash
    ADD CONSTRAINT organization_cash_organization_id_key UNIQUE (organization_id);
  END IF;
END $$;

-- 5-7. organization_id 외래키 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_cash_organization_id_fkey'
  ) THEN
    ALTER TABLE organization_cash
    ADD CONSTRAINT organization_cash_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5-8. user_id 컬럼 삭제 (CASCADE로 의존 객체도 함께 삭제)
ALTER TABLE organization_cash
DROP COLUMN IF EXISTS user_id CASCADE;

-- 5-9. 새로운 조직 기반 RLS 정책 추가
CREATE POLICY "Organization members can view their organization's cash balance"
ON organization_cash
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can update their organization's cash balance"
ON organization_cash
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can insert their organization's cash balance"
ON organization_cash
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- Step 6: organization_credits 테이블 수정
-- =====================================================

-- 6-0. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view their own credits balance" ON organization_credits;
DROP POLICY IF EXISTS "Users can update their own credits balance" ON organization_credits;
DROP POLICY IF EXISTS "Users can insert their own credits balance" ON organization_credits;
DROP POLICY IF EXISTS "Users can insert their own credits records" ON organization_credits;
DROP POLICY IF EXISTS "Users can view their own credits" ON organization_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON organization_credits;

-- 6-1. user_id 기반 외래키 제거
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_credits_user_id_fkey'
  ) THEN
    ALTER TABLE organization_credits DROP CONSTRAINT organization_credits_user_id_fkey;
  END IF;
END $$;

-- 6-2. user_id unique 제약조건 삭제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_credits_user_id_key'
  ) THEN
    ALTER TABLE organization_credits DROP CONSTRAINT organization_credits_user_id_key;
  END IF;
END $$;

-- 6-2-1. 기존 organization_id unique 제약조건도 삭제 (있다면)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_credits_organization_id_key'
  ) THEN
    ALTER TABLE organization_credits DROP CONSTRAINT user_credits_organization_id_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_credits_organization_id_key'
  ) THEN
    ALTER TABLE organization_credits DROP CONSTRAINT organization_credits_organization_id_key;
  END IF;
END $$;

-- 6-3. organization_id 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_credits' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE organization_credits ADD COLUMN organization_id uuid NULL;
  END IF;
END $$;

-- 6-4. 기존 user_id 데이터를 organization_id로 마이그레이션
UPDATE organization_credits c
SET organization_id = u.primary_organization_id
FROM users u
WHERE c.user_id = u.id
AND c.organization_id IS NULL
AND u.primary_organization_id IS NOT NULL;

-- 6-4-1. organization_id가 여전히 NULL인 행 삭제 (primary_organization_id가 없는 경우)
DELETE FROM organization_credits
WHERE organization_id IS NULL;

-- 6-4-2. 같은 organization_id를 가진 레코드들을 합산
-- 각 조직당 balance를 합산하여 가장 오래된 레코드에 저장
WITH ranked AS (
  SELECT
    id,
    organization_id,
    balance,
    ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC NULLS LAST, id::text) as rn
  FROM organization_credits
  WHERE organization_id IS NOT NULL
),
aggregated AS (
  SELECT
    organization_id,
    SUM(balance) as total_balance
  FROM organization_credits
  WHERE organization_id IS NOT NULL
  GROUP BY organization_id
)
UPDATE organization_credits c
SET balance = a.total_balance
FROM ranked r
INNER JOIN aggregated a ON r.organization_id = a.organization_id
WHERE c.id = r.id AND r.rn = 1;

-- 6-4-3. 중복 레코드 삭제 (각 조직의 첫 번째 레코드만 유지)
DELETE FROM organization_credits
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC NULLS LAST, id::text) as rn
    FROM organization_credits
    WHERE organization_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- 6-5. organization_id를 NOT NULL로 설정
ALTER TABLE organization_credits
ALTER COLUMN organization_id SET NOT NULL;

-- 6-6. organization_id unique 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_credits_organization_id_key'
  ) THEN
    ALTER TABLE organization_credits
    ADD CONSTRAINT organization_credits_organization_id_key UNIQUE (organization_id);
  END IF;
END $$;

-- 6-7. organization_id 외래키 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_credits_organization_id_fkey'
  ) THEN
    ALTER TABLE organization_credits
    ADD CONSTRAINT organization_credits_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6-8. user_id 컬럼 삭제 (CASCADE로 의존 객체도 함께 삭제)
ALTER TABLE organization_credits
DROP COLUMN IF EXISTS user_id CASCADE;

-- 6-9. 새로운 조직 기반 RLS 정책 추가
CREATE POLICY "Organization members can view their organization's credits balance"
ON organization_credits
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can update their organization's credits balance"
ON organization_credits
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can insert their organization's credits balance"
ON organization_credits
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 캐시/크레딧 시스템 마이그레이션 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. organization_cash: user_id → organization_id';
  RAISE NOTICE '2. organization_credits: user_id → organization_id';
  RAISE NOTICE '3. organization_cash_transactions: organization_id + used_by_user_id';
  RAISE NOTICE '4. organization_credit_transactions: organization_id + used_by_user_id';
  RAISE NOTICE '5. organization_cash_history: user_id 컬럼 삭제';
  RAISE NOTICE '6. organization_credits_history: user_id 컬럼 삭제';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '⚠️  다음 단계: API 코드 수정 필요';
  RAISE NOTICE '   - /api/cash/* API들을 organization_id 기반으로 수정';
  RAISE NOTICE '   - /api/credits/* API들을 organization_id 기반으로 수정';
  RAISE NOTICE '   - /api/admin/users/[id]/cash/* API 삭제';
  RAISE NOTICE '   - /api/admin/users/[id]/credits/* API 삭제';
  RAISE NOTICE '=================================================';
END $$;
