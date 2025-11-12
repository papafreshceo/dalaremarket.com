-- =====================================================
-- 셀러계정 정보를 users에서 organizations로 마이그레이션
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - users 테이블의 셀러계정 정보를 organizations 테이블로 복사
--   - primary_organization_id를 기준으로 데이터 이동
-- =====================================================

-- 먼저 users 테이블에 해당 컬럼들이 존재하는지 확인하고 복사
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  -- business_name 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'business_name'
  ) INTO v_column_exists;

  -- 컬럼이 존재하면 데이터 복사
  IF v_column_exists THEN
    UPDATE organizations o
    SET
      business_name = u.business_name,
      business_address = u.business_address,
      business_number = u.business_number,
      business_email = u.business_email,
      representative_name = u.representative_name,
      representative_phone = u.representative_phone,
      manager_name = u.manager_name,
      manager_phone = u.manager_phone,
      bank_account = u.bank_account,
      bank_name = u.bank_name,
      account_holder = u.account_holder,
      depositor_name = u.depositor_name,
      store_name = u.store_name,
      store_phone = u.store_phone
    FROM users u
    WHERE o.id = u.primary_organization_id
      AND (
        u.business_name IS NOT NULL OR
        u.business_address IS NOT NULL OR
        u.business_number IS NOT NULL OR
        u.business_email IS NOT NULL OR
        u.representative_name IS NOT NULL OR
        u.representative_phone IS NOT NULL OR
        u.manager_name IS NOT NULL OR
        u.manager_phone IS NOT NULL OR
        u.bank_account IS NOT NULL OR
        u.bank_name IS NOT NULL OR
        u.account_holder IS NOT NULL OR
        u.depositor_name IS NOT NULL OR
        u.store_name IS NOT NULL OR
        u.store_phone IS NOT NULL
      );

    RAISE NOTICE '기존 데이터를 users에서 organizations로 복사했습니다.';
  ELSE
    RAISE NOTICE 'users 테이블에 셀러 정보 컬럼이 없습니다. 데이터 복사를 건너뜁니다.';
  END IF;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  v_updated_count INTEGER;
  v_total_orgs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM organizations
  WHERE business_name IS NOT NULL OR business_number IS NOT NULL;

  SELECT COUNT(*) INTO v_total_orgs
  FROM organizations;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 셀러계정 정보 마이그레이션 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '총 조직 수: %', v_total_orgs;
  RAISE NOTICE '셀러정보 보유 조직: %', v_updated_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 코드에서 organizations 테이블 사용하도록 수정';
  RAISE NOTICE '2. cleanup_seller_info_from_users.sql 실행';
  RAISE NOTICE '=================================================';
END $$;
