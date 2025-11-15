-- =====================================================
-- 조직 생성 시 기본 서브계정 자동 생성
-- =====================================================
-- 작성일: 2025-11-15
-- 설명:
--   - 모든 조직은 생성 시 자동으로 "메인계정" 서브계정 생성
--   - 기존 조직에도 기본 서브계정 추가
--   - 기존 주문의 null sub_account_id를 기본 서브계정으로 업데이트
--   - 데이터 일관성 확보 (모든 주문이 sub_account_id를 가짐)
-- =====================================================

-- =====================================================
-- 1단계: sub_accounts 테이블에 is_main 컬럼 추가
-- =====================================================

ALTER TABLE sub_accounts
ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

DO $$
BEGIN
  RAISE NOTICE '✅ 1단계 완료: is_main 컬럼 추가';
END $$;

-- =====================================================
-- 2단계: 트리거 함수 생성 (새 조직 생성 시 기본 서브계정 자동 생성)
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_sub_account()
RETURNS TRIGGER AS $$
DECLARE
  v_business_name TEXT;
BEGIN
  -- 조직의 사업자명을 사용, 없으면 기본값
  v_business_name := COALESCE(NEW.business_name, '메인계정');

  -- 기본 서브계정 생성 (조직 정보 전체 복사)
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
    is_main,
    is_active
  ) VALUES (
    NEW.id,
    v_business_name,
    COALESCE(NEW.business_number, ''),
    COALESCE(NEW.representative_name, ''),
    COALESCE(NEW.business_address, ''),
    COALESCE(NEW.business_email, ''),
    COALESCE(NEW.representative_phone, ''),
    COALESCE(NEW.bank_name, ''),
    COALESCE(NEW.bank_account, ''),
    COALESCE(NEW.account_holder, ''),
    true,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (조직 INSERT 후 실행)
DROP TRIGGER IF EXISTS trigger_create_default_sub_account ON organizations;
CREATE TRIGGER trigger_create_default_sub_account
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_sub_account();

DO $$
BEGIN
  RAISE NOTICE '✅ 2단계 완료: 조직 생성 시 기본 서브계정 자동 생성 트리거 설치';
END $$;

-- =====================================================
-- 2-1단계: 조직 정보 수정 시 메인 서브계정 자동 동기화
-- =====================================================

CREATE OR REPLACE FUNCTION sync_main_sub_account()
RETURNS TRIGGER AS $$
DECLARE
  v_business_name TEXT;
BEGIN
  -- 조직의 사업자명을 사용, 없으면 기본값
  v_business_name := COALESCE(NEW.business_name, '메인계정');

  -- 조직 정보가 변경되면 메인 서브계정도 업데이트
  UPDATE sub_accounts
  SET
    business_name = v_business_name,
    business_number = COALESCE(NEW.business_number, ''),
    representative_name = COALESCE(NEW.representative_name, ''),
    address = COALESCE(NEW.business_address, ''),
    email = COALESCE(NEW.business_email, ''),
    phone = COALESCE(NEW.representative_phone, ''),
    bank_name = COALESCE(NEW.bank_name, ''),
    account_number = COALESCE(NEW.bank_account, ''),
    account_holder = COALESCE(NEW.account_holder, ''),
    updated_at = NOW()
  WHERE organization_id = NEW.id
    AND is_main = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (조직 UPDATE 후 실행)
DROP TRIGGER IF EXISTS trigger_sync_main_sub_account ON organizations;
CREATE TRIGGER trigger_sync_main_sub_account
  AFTER UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION sync_main_sub_account();

DO $$
BEGIN
  RAISE NOTICE '✅ 2-1단계 완료: 조직 수정 시 메인 서브계정 자동 동기화 트리거 설치';
END $$;

-- =====================================================
-- 3단계: 기존 조직에 기본 서브계정 추가
-- =====================================================

DO $$
DECLARE
  v_org RECORD;
  v_inserted_count INTEGER := 0;
  v_business_name TEXT;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '3단계: 기존 조직에 기본 서브계정 추가 시작';
  RAISE NOTICE '================================================';

  -- 서브계정이 없는 조직 찾아서 기본 서브계정 생성
  FOR v_org IN
    SELECT o.id, o.business_name, o.business_number, o.representative_name,
           o.business_address, o.business_email, o.representative_phone,
           o.bank_name, o.bank_account, o.account_holder
    FROM organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
    )
  LOOP
    -- 사업자명 결정
    v_business_name := COALESCE(v_org.business_name, '메인계정');

    -- 기본 서브계정 생성 (조직 정보 전체 복사)
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
      true,
      true
    );

    v_inserted_count := v_inserted_count + 1;

    IF v_inserted_count % 10 = 0 THEN
      RAISE NOTICE '진행 중: % 개 조직에 기본 서브계정 추가됨', v_inserted_count;
    END IF;
  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ 3단계 완료: % 개 조직에 기본 서브계정 추가 완료', v_inserted_count;
  RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- 4단계: 기존 주문의 null sub_account_id 업데이트
-- =====================================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_order RECORD;
  v_default_sub_account_id UUID;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '4단계: 기존 주문의 sub_account_id 업데이트 시작';
  RAISE NOTICE '================================================';

  -- sub_account_id가 null인 주문 찾기
  FOR v_order IN
    SELECT id, organization_id
    FROM integrated_orders
    WHERE sub_account_id IS NULL
      AND organization_id IS NOT NULL
  LOOP
    -- 해당 조직의 메인 서브계정 찾기
    SELECT id INTO v_default_sub_account_id
    FROM sub_accounts
    WHERE organization_id = v_order.organization_id
      AND is_main = true
      AND is_active = true
    LIMIT 1;

    -- 서브계정이 있으면 업데이트
    IF v_default_sub_account_id IS NOT NULL THEN
      UPDATE integrated_orders
      SET sub_account_id = v_default_sub_account_id
      WHERE id = v_order.id;

      v_updated_count := v_updated_count + 1;

      IF v_updated_count % 100 = 0 THEN
        RAISE NOTICE '진행 중: % 개 주문 업데이트됨', v_updated_count;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ 4단계 완료: % 개 주문의 sub_account_id 업데이트 완료', v_updated_count;
  RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- 5단계: 검증 쿼리
-- =====================================================

DO $$
DECLARE
  v_orgs_without_sub INTEGER;
  v_orders_without_sub INTEGER;
  v_total_orgs INTEGER;
  v_total_orders INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '5단계: 마이그레이션 결과 검증';
  RAISE NOTICE '================================================';

  -- 전체 조직 수
  SELECT COUNT(*) INTO v_total_orgs FROM organizations;

  -- 서브계정이 없는 조직 수
  SELECT COUNT(*) INTO v_orgs_without_sub
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
  );

  -- 전체 주문 수 (organization_id가 있는 것만)
  SELECT COUNT(*) INTO v_total_orders
  FROM integrated_orders
  WHERE organization_id IS NOT NULL;

  -- sub_account_id가 null인 주문 수
  SELECT COUNT(*) INTO v_orders_without_sub
  FROM integrated_orders
  WHERE organization_id IS NOT NULL
    AND sub_account_id IS NULL;

  RAISE NOTICE '전체 조직: %', v_total_orgs;
  RAISE NOTICE '서브계정 없는 조직: %', v_orgs_without_sub;
  RAISE NOTICE '전체 주문 (organization 있음): %', v_total_orders;
  RAISE NOTICE 'sub_account_id가 null인 주문: %', v_orders_without_sub;
  RAISE NOTICE '================================================';

  IF v_orgs_without_sub = 0 AND v_orders_without_sub = 0 THEN
    RAISE NOTICE '✅ 마이그레이션 성공: 모든 조직에 기본 서브계정이 있고, 모든 주문이 sub_account_id를 가집니다.';
  ELSE
    RAISE WARNING '⚠️  일부 데이터가 누락되었습니다. 위 통계를 확인하세요.';
  END IF;
  RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 기본 서브계정 마이그레이션 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. sub_accounts 테이블에 is_main 컬럼 추가';
  RAISE NOTICE '2. 새 조직 생성 시 자동으로 기본 서브계정 생성 (INSERT 트리거)';
  RAISE NOTICE '2-1. 조직 수정 시 메인 서브계정 자동 동기화 (UPDATE 트리거)';
  RAISE NOTICE '3. 기존 조직에 기본 서브계정 추가';
  RAISE NOTICE '4. 기존 주문의 sub_account_id 업데이트';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '효과:';
  RAISE NOTICE '- 모든 조직이 최소 1개의 메인 서브계정 보유';
  RAISE NOTICE '- 모든 주문이 sub_account_id를 가짐 (데이터 일관성)';
  RAISE NOTICE '- is_main = true로 메인계정과 추가 서브계정 구분';
  RAISE NOTICE '- 조직 정보 수정 시 메인 서브계정 자동 동기화';
  RAISE NOTICE '- 통계 쿼리 단순화 (null 체크 불필요)';
  RAISE NOTICE '=================================================';
END $$;
