-- =====================================================
-- 서브계정-조직 동기화 문제 수정
-- =====================================================

-- 1. 서브계정이 없는 조직에 메인 서브계정 생성
DO $$
DECLARE
  v_org RECORD;
  v_inserted_count INTEGER := 0;
  v_business_name TEXT;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '1단계: 서브계정이 없는 조직에 메인 서브계정 생성';
  RAISE NOTICE '================================================';

  FOR v_org IN
    SELECT o.id, o.business_name, o.business_number, o.representative_name,
           o.business_address, o.business_email, o.representative_phone,
           o.bank_name, o.bank_account, o.account_holder, o.seller_code
    FROM organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
    )
  LOOP
    v_business_name := COALESCE(v_org.business_name, '메인계정');

    INSERT INTO sub_accounts (
      organization_id,
      business_name,
      business_number,
      representative_name,
      address,
      email,
      phone,
      bank_name,
      account_number,
      account_holder,
      seller_code,
      is_main,
      is_active
    ) VALUES (
      v_org.id,
      v_business_name,
      COALESCE(v_org.business_number, ''),
      COALESCE(v_org.representative_name, ''),
      COALESCE(v_org.business_address, ''),
      COALESCE(v_org.business_email, ''),
      COALESCE(v_org.representative_phone, ''),
      COALESCE(v_org.bank_name, ''),
      COALESCE(v_org.bank_account, ''),
      COALESCE(v_org.account_holder, ''),
      COALESCE(v_org.seller_code, 'S000000'),
      true,
      true
    );

    v_inserted_count := v_inserted_count + 1;

    RAISE NOTICE '✅ 조직 % (%): 메인 서브계정 생성', v_org.business_name, v_org.seller_code;
  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ %개 조직에 메인 서브계정 생성 완료', v_inserted_count;
  RAISE NOTICE '================================================';
END $$;

-- 2. 메인 서브계정의 정보를 조직 정보로 동기화
DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '2단계: 메인 서브계정 정보 동기화';
  RAISE NOTICE '================================================';

  UPDATE sub_accounts sa
  SET
    business_name = COALESCE(o.business_name, '메인계정'),
    business_number = COALESCE(o.business_number, ''),
    representative_name = COALESCE(o.representative_name, ''),
    address = COALESCE(o.business_address, ''),
    email = COALESCE(o.business_email, ''),
    phone = COALESCE(o.representative_phone, ''),
    bank_name = COALESCE(o.bank_name, ''),
    account_number = COALESCE(o.bank_account, ''),
    account_holder = COALESCE(o.account_holder, ''),
    seller_code = COALESCE(o.seller_code, 'S000000'),
    updated_at = NOW()
  FROM organizations o
  WHERE sa.organization_id = o.id
    AND sa.is_main = true
    AND (
      sa.business_name IS NULL OR sa.business_name = '' OR
      sa.business_name != o.business_name OR
      sa.seller_code IS NULL OR
      sa.seller_code != o.seller_code
    );

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE '✅ %개 메인 서브계정 정보 동기화 완료', v_updated_count;
  RAISE NOTICE '================================================';
END $$;

-- 3. 검증
DO $$
DECLARE
  v_no_sub_count INTEGER;
  v_no_name_count INTEGER;
  v_no_code_count INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '3단계: 수정 결과 검증';
  RAISE NOTICE '================================================';

  -- 서브계정 없는 조직
  SELECT COUNT(*) INTO v_no_sub_count
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
  );

  -- 사업자명 없는 메인 서브계정
  SELECT COUNT(*) INTO v_no_name_count
  FROM sub_accounts sa
  WHERE sa.is_main = true
    AND (sa.business_name IS NULL OR sa.business_name = '');

  -- 셀러코드 없는 메인 서브계정
  SELECT COUNT(*) INTO v_no_code_count
  FROM sub_accounts sa
  WHERE sa.is_main = true
    AND sa.seller_code IS NULL;

  RAISE NOTICE '서브계정 없는 조직: %개', v_no_sub_count;
  RAISE NOTICE '사업자명 없는 메인 서브계정: %개', v_no_name_count;
  RAISE NOTICE '셀러코드 없는 메인 서브계정: %개', v_no_code_count;

  IF v_no_sub_count = 0 AND v_no_name_count = 0 AND v_no_code_count = 0 THEN
    RAISE NOTICE '✅ 모든 데이터가 정상적으로 동기화되었습니다!';
  ELSE
    RAISE WARNING '⚠️ 일부 문제가 남아있습니다. 위 통계를 확인하세요.';
  END IF;

  RAISE NOTICE '================================================';
END $$;

-- 4. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 서브계정-조직 동기화 수정 완료';
  RAISE NOTICE '=================================================';
END $$;
