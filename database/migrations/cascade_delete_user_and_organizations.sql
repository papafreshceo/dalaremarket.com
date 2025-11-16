-- =====================================================
-- 사용자 삭제 시 전체 데이터 CASCADE DELETE 설정
-- =====================================================
-- 작성일: 2025-01-16
-- 설명:
--   1. auth.users 삭제 → users 삭제 (트리거)
--   2. users 삭제 → organizations 삭제 (CASCADE)
--   3. organizations 삭제 → 관련 데이터 삭제 (CASCADE)
--   ⚠️ 주의: integrated_orders는 정산/회계 기록이므로 삭제하지 않고 organization_id만 NULL 처리
-- =====================================================

-- =====================================================
-- 1. users 테이블의 primary_organization_id CASCADE 설정
-- =====================================================
DO $$
BEGIN
  -- primary_organization_id의 기존 제약조건 삭제
  ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_primary_organization_id_fkey;

  -- CASCADE 설정으로 재생성
  ALTER TABLE users
  ADD CONSTRAINT users_primary_organization_id_fkey
  FOREIGN KEY (primary_organization_id)
  REFERENCES organizations(id)
  ON DELETE SET NULL;  -- 조직 삭제 시 NULL로 설정

  RAISE NOTICE 'users.primary_organization_id CASCADE 설정 완료';
END $$;

-- =====================================================
-- 2. organizations 테이블의 owner_id CASCADE 설정
-- =====================================================
DO $$
BEGIN
  -- owner_id의 기존 제약조건 삭제
  ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;

  -- CASCADE 설정으로 재생성 (사용자 삭제 시 조직도 삭제)
  ALTER TABLE organizations
  ADD CONSTRAINT organizations_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

  RAISE NOTICE 'organizations.owner_id CASCADE 설정 완료';
END $$;

-- =====================================================
-- 3. sub_accounts 테이블 CASCADE 설정
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'sub_accounts'
  ) THEN
    -- organization_id CASCADE (이미 설정되어 있지만 재확인)
    ALTER TABLE sub_accounts
    DROP CONSTRAINT IF EXISTS sub_accounts_organization_id_fkey;

    ALTER TABLE sub_accounts
    ADD CONSTRAINT sub_accounts_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'sub_accounts CASCADE 설정 완료';
  END IF;
END $$;

-- =====================================================
-- 4. integrated_orders에 조직명 저장 컬럼 추가 및 CASCADE DELETE 제거
-- =====================================================
DO $$
BEGIN
  -- 조직 사업자명 저장 컬럼 추가 (아직 없으면)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'business_name_snapshot'
  ) THEN
    ALTER TABLE integrated_orders
    ADD COLUMN business_name_snapshot TEXT;

    RAISE NOTICE 'integrated_orders.business_name_snapshot 컬럼 추가 완료';
  END IF;

  -- 서브계정 사업자명 저장 컬럼 추가 (아직 없으면)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'sub_account_name_snapshot'
  ) THEN
    ALTER TABLE integrated_orders
    ADD COLUMN sub_account_name_snapshot TEXT;

    RAISE NOTICE 'integrated_orders.sub_account_name_snapshot 컬럼 추가 완료';
  END IF;

  -- 기존 데이터에 조직 사업자명 복사
  UPDATE integrated_orders io
  SET business_name_snapshot = o.business_name
  FROM organizations o
  WHERE io.organization_id = o.id
    AND io.business_name_snapshot IS NULL;

  RAISE NOTICE 'integrated_orders에 기존 조직 사업자명 복사 완료';

  -- 기존 데이터에 서브계정 사업자명 복사
  UPDATE integrated_orders io
  SET sub_account_name_snapshot = sa.business_name
  FROM sub_accounts sa
  WHERE io.sub_account_id = sa.id
    AND io.sub_account_name_snapshot IS NULL;

  RAISE NOTICE 'integrated_orders에 기존 서브계정 사업자명 복사 완료';

  -- CASCADE DELETE 제약조건 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_orders' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE integrated_orders
    DROP CONSTRAINT IF EXISTS integrated_orders_organization_id_fkey;

    -- NO ACTION으로 재생성 (조직 삭제 시 주문은 그대로 유지)
    -- organization_id와 organization_name_snapshot 모두 보존
    ALTER TABLE integrated_orders
    ADD CONSTRAINT integrated_orders_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'integrated_orders foreign key 설정 완료 (ON DELETE SET NULL)';
  END IF;
END $$;

-- =====================================================
-- 4-1. 조직 및 서브계정 사업자명 자동 저장 트리거 생성
-- =====================================================
-- 주문 생성/수정 시 조직 및 서브계정 사업자명 자동 저장
CREATE OR REPLACE FUNCTION save_business_names_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- 조직 사업자명 저장
  IF NEW.organization_id IS NOT NULL THEN
    SELECT business_name INTO NEW.business_name_snapshot
    FROM organizations
    WHERE id = NEW.organization_id;
  END IF;

  -- 서브계정 사업자명 저장
  IF NEW.sub_account_id IS NOT NULL THEN
    SELECT business_name INTO NEW.sub_account_name_snapshot
    FROM sub_accounts
    WHERE id = NEW.sub_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS save_business_names_trigger ON integrated_orders;

CREATE TRIGGER save_business_names_trigger
  BEFORE INSERT OR UPDATE OF organization_id, sub_account_id ON integrated_orders
  FOR EACH ROW
  EXECUTE FUNCTION save_business_names_on_order();

-- =====================================================
-- 5. 모든 users 참조 테이블에 CASCADE 또는 SET NULL 설정
-- =====================================================
DO $$
DECLARE
  r RECORD;
  v_delete_action TEXT;
BEGIN
  -- users 테이블을 참조하는 모든 외래키 찾기 및 CASCADE 설정
  FOR r IN
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND tc.table_schema = 'public'
  LOOP
    -- 회계/정산 테이블은 SET NULL, 나머지는 CASCADE
    IF r.table_name IN ('transaction_statements', 'integrated_orders') THEN
      v_delete_action := 'SET NULL';
    ELSE
      v_delete_action := 'CASCADE';
    END IF;

    -- 기존 제약조건 삭제
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
                   r.table_name, r.constraint_name);

    -- CASCADE 또는 SET NULL 설정으로 재생성
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES users(id) ON DELETE %s',
                   r.table_name, r.constraint_name, r.column_name, v_delete_action);

    RAISE NOTICE '% 테이블의 % - ON DELETE % 설정 완료', r.table_name, r.constraint_name, v_delete_action;
  END LOOP;

  -- organization_cash_history
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'organization_cash_history'
  ) THEN
    ALTER TABLE organization_cash_history
    DROP CONSTRAINT IF EXISTS organization_cash_history_organization_id_fkey;

    ALTER TABLE organization_cash_history
    ADD CONSTRAINT organization_cash_history_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'organization_cash_history CASCADE 설정 완료';
  END IF;

  -- organization_credits_history
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'organization_credits_history'
  ) THEN
    ALTER TABLE organization_credits_history
    DROP CONSTRAINT IF EXISTS organization_credits_history_organization_id_fkey;

    ALTER TABLE organization_credits_history
    ADD CONSTRAINT organization_credits_history_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'organization_credits_history CASCADE 설정 완료';
  END IF;
END $$;

-- =====================================================
-- 6. organization_members CASCADE DELETE 시 자동 조직 생성 트리거
-- =====================================================
-- 트리거 함수: 멤버가 조직에서 제거될 때 자동으로 개인 조직 생성
-- 주의: 조직 전체가 삭제되는 경우(CASCADE)가 아니라, 개별 멤버만 제거되는 경우에만 실행
CREATE OR REPLACE FUNCTION auto_create_org_for_orphaned_member()
RETURNS TRIGGER AS $$
DECLARE
  v_user_record RECORD;
  v_org_exists BOOLEAN;
  v_new_org_id UUID;
  v_new_org_name TEXT;
  v_seller_code TEXT;
  v_partner_code TEXT;
BEGIN
  -- 조직이 여전히 존재하는지 확인 (존재하지 않으면 CASCADE 삭제 중)
  v_org_exists := EXISTS(SELECT 1 FROM organizations WHERE id = OLD.organization_id);

  -- CASCADE 삭제(조직 전체 삭제)인 경우 트리거 실행 안 함
  IF v_org_exists = FALSE THEN
    RAISE NOTICE '조직 CASCADE 삭제 감지 - 자동 조직 생성 스킵';
    RETURN OLD;
  END IF;

  -- 삭제된 멤버의 사용자 정보 가져오기
  SELECT * INTO v_user_record
  FROM users
  WHERE id = OLD.user_id;

  -- 사용자가 존재하고, 삭제된 조직이 primary_organization이었다면
  IF v_user_record.id IS NOT NULL AND v_user_record.primary_organization_id = OLD.organization_id THEN

    -- 새 조직명 생성 (사용자 이름 기반)
    v_new_org_name := COALESCE(v_user_record.name, '새 조직') || '의 조직';

    -- 셀러 코드 생성 (S + 6자리 랜덤)
    v_seller_code := 'S' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- 파트너 코드 생성 (P + 6자리 랜덤)
    v_partner_code := 'P' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- 새 개인 조직 생성
    INSERT INTO organizations (
      owner_id,
      business_name,
      business_registration_number,
      representative_name,
      business_type,
      business_category,
      postal_code,
      address,
      detailed_address,
      phone_number,
      email,
      bank_name,
      account_number,
      account_holder,
      seller_code,
      partner_code,
      created_at,
      updated_at
    ) VALUES (
      v_user_record.id,
      v_new_org_name,
      '',  -- 빈 사업자등록번호
      COALESCE(v_user_record.name, '대표자'),
      '',
      '',
      '',
      '',
      '',
      COALESCE(v_user_record.phone, ''),
      COALESCE(v_user_record.email, ''),
      '',
      '',
      '',
      v_seller_code,
      v_partner_code,
      NOW(),
      NOW()
    ) RETURNING id INTO v_new_org_id;

    -- 사용자의 primary_organization_id 업데이트
    UPDATE users
    SET primary_organization_id = v_new_org_id,
        updated_at = NOW()
    WHERE id = v_user_record.id;

    RAISE NOTICE '사용자 %에게 새 조직 % 자동 생성됨', v_user_record.email, v_new_org_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성: organization_members 삭제 시 (개별 멤버 제거 시에만)
DROP TRIGGER IF EXISTS on_organization_member_deleted ON organization_members;

CREATE TRIGGER on_organization_member_deleted
  AFTER DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_org_for_orphaned_member();

-- =====================================================
-- 7. auth.users 삭제 시 public.users 자동 삭제 트리거
-- =====================================================
-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION delete_user_on_auth_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- public.users에서 해당 사용자 삭제
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION delete_user_on_auth_delete();

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '사용자 CASCADE DELETE 설정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '삭제 흐름:';
  RAISE NOTICE '  1. auth.users 삭제 (Supabase Dashboard 또는 SQL)';
  RAISE NOTICE '  2. → public.users 자동 삭제 (트리거)';
  RAISE NOTICE '  3. → organizations 자동 삭제 (owner_id CASCADE)';
  RAISE NOTICE '  4. → organization_members 자동 삭제 (CASCADE)';
  RAISE NOTICE '      ⭐ 멤버였던 사용자들에게 새 개인 조직 자동 생성!';
  RAISE NOTICE '  5. → 모든 조직 관련 데이터 자동 삭제:';
  RAISE NOTICE '      ✓ sub_accounts (삭제)';
  RAISE NOTICE '      ✓ cash_transactions (삭제)';
  RAISE NOTICE '      ✓ credits_transactions (삭제)';
  RAISE NOTICE '      ✓ organization_cash_history (삭제)';
  RAISE NOTICE '      ✓ organization_credits_history (삭제)';
  RAISE NOTICE '      ✓ organization_daily_rewards (삭제)';
  RAISE NOTICE '      ✓ organization_points (삭제)';
  RAISE NOTICE '      ✓ notifications (삭제)';
  RAISE NOTICE '      ⚠️  integrated_orders (완전 보존)';
  RAISE NOTICE '          - organization_id: NULL';
  RAISE NOTICE '          - business_name_snapshot: 조직 사업자명 유지';
  RAISE NOTICE '          - sub_account_id: NULL';
  RAISE NOTICE '          - sub_account_name_snapshot: 서브계정 사업자명 유지';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️  주의사항:';
  RAISE NOTICE '  - 주문 기록은 정산/회계 목적으로 완전히 보존됩니다';
  RAISE NOTICE '  - 삭제된 조직/서브계정의 사업자명은 스냅샷으로 남습니다';
  RAISE NOTICE '  - 새 주문 생성 시 사업자명이 자동으로 저장됩니다 (트리거)';
  RAISE NOTICE '  - 예시: "달래마켓 주식회사 (서브: 달래1호점)"';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⭐ 자동 조직 생성:';
  RAISE NOTICE '  - 조직 소유자가 탈퇴하면 멤버들에게 자동으로 개인 조직 생성';
  RAISE NOTICE '  - 셀러 코드 & 파트너 코드 자동 생성';
  RAISE NOTICE '  - 탈퇴는 완전히 자유롭습니다! (모든 멤버 보호)';
  RAISE NOTICE '========================================';
END $$;
