-- =====================================================
-- 조직-메인서브계정 동기화 트리거 통합
-- =====================================================
-- 설명:
--   - 기존 sync_main_sub_account와 sync_main_sub_account_seller_code를 하나로 통합
--   - 조직 정보 수정 시 메인 서브계정의 모든 필드 동기화
--   - seller_code 포함
-- =====================================================

-- 1. 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_sync_main_sub_account ON organizations;
DROP TRIGGER IF EXISTS trigger_sync_main_sub_account_seller_code ON organizations;

-- 2. 통합 트리거 함수 생성
CREATE OR REPLACE FUNCTION sync_main_sub_account()
RETURNS TRIGGER AS $$
DECLARE
  v_business_name TEXT;
BEGIN
  -- 조직의 사업자명을 사용, 없으면 기본값
  v_business_name := COALESCE(NEW.business_name, '메인계정');

  -- 조직 정보가 변경되면 메인 서브계정도 업데이트 (seller_code 포함)
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
    seller_code = COALESCE(NEW.seller_code, seller_code), -- seller_code 추가
    updated_at = NOW()
  WHERE organization_id = NEW.id
    AND is_main = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 통합 트리거 생성
CREATE TRIGGER trigger_sync_main_sub_account
  AFTER UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION sync_main_sub_account();

-- 4. 메인 서브계정 생성 시에도 seller_code 복사하도록 함수 업데이트
CREATE OR REPLACE FUNCTION create_default_sub_account()
RETURNS TRIGGER AS $$
DECLARE
  v_business_name TEXT;
BEGIN
  -- 조직의 사업자명을 사용, 없으면 기본값
  v_business_name := COALESCE(NEW.business_name, '메인계정');

  -- 기본 서브계정 생성 (조직 정보 전체 복사, seller_code 포함)
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
    seller_code,  -- seller_code 추가
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
    COALESCE(NEW.seller_code, 'S000000'),  -- seller_code 복사
    true,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 기존 메인 서브계정 중 seller_code가 조직과 다른 경우 동기화
DO $$
DECLARE
  synced_count INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '기존 메인 서브계정의 seller_code 동기화 시작';
  RAISE NOTICE '================================================';

  UPDATE sub_accounts sa
  SET seller_code = o.seller_code
  FROM organizations o
  WHERE sa.organization_id = o.id
    AND sa.is_main = true
    AND (sa.seller_code IS NULL OR sa.seller_code != o.seller_code);

  GET DIAGNOSTICS synced_count = ROW_COUNT;

  RAISE NOTICE '✅ %개 메인 서브계정의 seller_code 동기화 완료', synced_count;
  RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 조직-메인서브계정 동기화 트리거 통합 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. sync_main_sub_account 트리거 함수에 seller_code 동기화 추가';
  RAISE NOTICE '2. create_default_sub_account 함수에 seller_code 복사 추가';
  RAISE NOTICE '3. 기존 메인 서브계정의 seller_code 동기화';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '동기화되는 필드:';
  RAISE NOTICE '- business_name (사업자명)';
  RAISE NOTICE '- business_number (사업자번호)';
  RAISE NOTICE '- representative_name (대표자명)';
  RAISE NOTICE '- address (주소)';
  RAISE NOTICE '- email (이메일)';
  RAISE NOTICE '- phone (전화번호)';
  RAISE NOTICE '- bank_name (은행명)';
  RAISE NOTICE '- account_number (계좌번호)';
  RAISE NOTICE '- account_holder (예금주)';
  RAISE NOTICE '- seller_code (셀러코드) ⭐ 추가됨';
  RAISE NOTICE '=================================================';
END $$;
