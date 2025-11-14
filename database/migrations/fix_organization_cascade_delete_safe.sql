-- 조직 삭제 시 관련 데이터도 함께 삭제되도록 CASCADE 설정
-- 존재하는 테이블만 수정하는 안전한 버전

-- 1. integrated_orders 외래키 제약조건 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE integrated_orders
    DROP CONSTRAINT IF EXISTS integrated_orders_organization_id_fkey;

    ALTER TABLE integrated_orders
    ADD CONSTRAINT integrated_orders_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'integrated_orders CASCADE 설정 완료';
  ELSE
    RAISE NOTICE 'integrated_orders 테이블에 organization_id 컬럼이 없어서 스킵';
  END IF;
END $$;

-- 2. organization_members 외래키 제약조건 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'organization_members'
  ) THEN
    ALTER TABLE organization_members
    DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;

    ALTER TABLE organization_members
    ADD CONSTRAINT organization_members_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'organization_members CASCADE 설정 완료';
  END IF;
END $$;

-- 3. organization_invitations 외래키 제약조건 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'organization_invitations'
  ) THEN
    ALTER TABLE organization_invitations
    DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;

    ALTER TABLE organization_invitations
    ADD CONSTRAINT organization_invitations_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'organization_invitations CASCADE 설정 완료';
  END IF;
END $$;

-- 4. cash_transactions 외래키 제약조건 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE cash_transactions
    DROP CONSTRAINT IF EXISTS cash_transactions_organization_id_fkey;

    ALTER TABLE cash_transactions
    ADD CONSTRAINT cash_transactions_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'cash_transactions CASCADE 설정 완료';
  ELSE
    RAISE NOTICE 'cash_transactions 테이블에 organization_id 컬럼이 없어서 스킵';
  END IF;
END $$;

-- 5. credits_transactions 외래키 제약조건 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credits_transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE credits_transactions
    DROP CONSTRAINT IF EXISTS credits_transactions_organization_id_fkey;

    ALTER TABLE credits_transactions
    ADD CONSTRAINT credits_transactions_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'credits_transactions CASCADE 설정 완료';
  ELSE
    RAISE NOTICE 'credits_transactions 테이블에 organization_id 컬럼이 없어서 스킵';
  END IF;
END $$;

-- 6. organization_daily_rewards 외래키 제약조건 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_daily_rewards' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE organization_daily_rewards
    DROP CONSTRAINT IF EXISTS organization_daily_rewards_organization_id_fkey;

    ALTER TABLE organization_daily_rewards
    ADD CONSTRAINT organization_daily_rewards_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'organization_daily_rewards CASCADE 설정 완료';
  ELSE
    RAISE NOTICE 'organization_daily_rewards 테이블에 organization_id 컬럼이 없어서 스킵';
  END IF;
END $$;

-- 7. organization_points 외래키 제약조건 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_points' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE organization_points
    DROP CONSTRAINT IF EXISTS organization_points_organization_id_fkey;

    ALTER TABLE organization_points
    ADD CONSTRAINT organization_points_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'organization_points CASCADE 설정 완료';
  ELSE
    RAISE NOTICE 'organization_points 테이블에 organization_id 컬럼이 없어서 스킵';
  END IF;
END $$;

-- 8. notifications 외래키 제약조건 수정 (컬럼 존재 여부도 확인)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_organization_id_fkey;

    ALTER TABLE notifications
    ADD CONSTRAINT notifications_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'notifications CASCADE 설정 완료';
  ELSE
    RAISE NOTICE 'notifications 테이블에 organization_id 컬럼이 없어서 스킵';
  END IF;
END $$;

COMMENT ON TABLE organizations IS '조직 테이블 - CASCADE DELETE 설정으로 관련 데이터 자동 삭제';
