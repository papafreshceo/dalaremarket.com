-- =====================================================
-- 서브계정-조직 동기화 (진단 + 수정 통합)
-- =====================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1️⃣ 수정 전 상태 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  v_no_sub_count INTEGER;
  v_no_name_count INTEGER;
  v_no_code_count INTEGER;
  v_total_orgs INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 수정 전 상태';
  RAISE NOTICE '================================================';

  SELECT COUNT(*) INTO v_total_orgs FROM organizations;

  SELECT COUNT(*) INTO v_no_sub_count
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
  );

  SELECT COUNT(*) INTO v_no_name_count
  FROM sub_accounts sa
  WHERE sa.is_main = true
    AND (sa.business_name IS NULL OR sa.business_name = '');

  SELECT COUNT(*) INTO v_no_code_count
  FROM sub_accounts sa
  WHERE sa.is_main = true
    AND sa.seller_code IS NULL;

  RAISE NOTICE '전체 조직: %개', v_total_orgs;
  RAISE NOTICE '서브계정 없는 조직: %개 ⚠️', v_no_sub_count;
  RAISE NOTICE '사업자명 없는 메인 서브계정: %개 ⚠️', v_no_name_count;
  RAISE NOTICE '셀러코드 없는 메인 서브계정: %개 ⚠️', v_no_code_count;
  RAISE NOTICE '================================================';
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2️⃣ 서브계정이 없는 조직에 메인 서브계정 생성
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  v_org RECORD;
  v_inserted_count INTEGER := 0;
  v_business_name TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔧 서브계정이 없는 조직에 메인 서브계정 생성';
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

    RAISE NOTICE '✅ % (%) - 메인 서브계정 생성', v_org.business_name, v_org.seller_code;
  END LOOP;

  IF v_inserted_count = 0 THEN
    RAISE NOTICE '✅ 생성할 메인 서브계정 없음 (모든 조직에 이미 존재)';
  ELSE
    RAISE NOTICE '✅ %개 조직에 메인 서브계정 생성 완료', v_inserted_count;
  END IF;
  RAISE NOTICE '================================================';
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3️⃣ 메인 서브계정의 정보를 조직 정보로 동기화
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔄 메인 서브계정 정보 동기화';
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
      sa.seller_code != o.seller_code OR
      sa.business_number != o.business_number OR
      sa.representative_name != o.representative_name
    );

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RAISE NOTICE '✅ 업데이트할 메인 서브계정 없음 (모두 이미 동기화됨)';
  ELSE
    RAISE NOTICE '✅ %개 메인 서브계정 정보 동기화 완료', v_updated_count;
  END IF;
  RAISE NOTICE '================================================';
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4️⃣ 수정 후 상태 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  v_no_sub_count INTEGER;
  v_no_name_count INTEGER;
  v_no_code_count INTEGER;
  v_total_orgs INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ 수정 후 상태';
  RAISE NOTICE '================================================';

  SELECT COUNT(*) INTO v_total_orgs FROM organizations;

  SELECT COUNT(*) INTO v_no_sub_count
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
  );

  SELECT COUNT(*) INTO v_no_name_count
  FROM sub_accounts sa
  WHERE sa.is_main = true
    AND (sa.business_name IS NULL OR sa.business_name = '');

  SELECT COUNT(*) INTO v_no_code_count
  FROM sub_accounts sa
  WHERE sa.is_main = true
    AND sa.seller_code IS NULL;

  RAISE NOTICE '전체 조직: %개', v_total_orgs;
  RAISE NOTICE '서브계정 없는 조직: %개', v_no_sub_count;
  RAISE NOTICE '사업자명 없는 메인 서브계정: %개', v_no_name_count;
  RAISE NOTICE '셀러코드 없는 메인 서브계정: %개', v_no_code_count;

  IF v_no_sub_count = 0 AND v_no_name_count = 0 AND v_no_code_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 모든 데이터가 정상적으로 동기화되었습니다!';
  ELSE
    RAISE WARNING '';
    RAISE WARNING '⚠️ 일부 문제가 남아있습니다. 위 통계를 확인하세요.';
  END IF;

  RAISE NOTICE '================================================';
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 완료
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 서브계정-조직 동기화 완료!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '수행된 작업:';
  RAISE NOTICE '1. 서브계정 없는 조직에 메인 서브계정 생성';
  RAISE NOTICE '2. 메인 서브계정 정보를 조직 정보로 동기화';
  RAISE NOTICE '   - business_name (사업자명)';
  RAISE NOTICE '   - business_number (사업자번호)';
  RAISE NOTICE '   - representative_name (대표자명)';
  RAISE NOTICE '   - address (주소)';
  RAISE NOTICE '   - email (이메일)';
  RAISE NOTICE '   - phone (전화번호)';
  RAISE NOTICE '   - bank_name, account_number, account_holder';
  RAISE NOTICE '   - seller_code (셀러코드)';
  RAISE NOTICE '=================================================';
END $$;
