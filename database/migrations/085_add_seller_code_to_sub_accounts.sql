-- =====================================================
-- sub_accounts 테이블에 seller_code 칼럼 추가 및 자동 생성
-- =====================================================
-- 설명:
--   - 메인 서브계정: 조직의 seller_code 복사 (S123456)
--   - 추가 서브계정: 새로운 SA 코드 생성 (SA123456)
--   - 발주번호 생성에 사용
-- =====================================================

-- 1. seller_code 칼럼 추가
ALTER TABLE sub_accounts
ADD COLUMN IF NOT EXISTS seller_code VARCHAR(50) UNIQUE;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sub_accounts_seller_code ON sub_accounts(seller_code);

-- 3. 코멘트 추가
COMMENT ON COLUMN sub_accounts.seller_code IS '서브계정 셀러 코드 (메인: S코드 복사, 추가: SA코드 생성)';

-- 4. 기존 서브계정에 seller_code 생성
DO $$
DECLARE
  sub_account_record RECORD;
  org_seller_code TEXT;
  new_seller_code TEXT;
  code_exists BOOLEAN;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '기존 서브계정에 seller_code 생성 시작';
  RAISE NOTICE '================================================';

  -- seller_code가 없는 서브계정에 대해 처리
  FOR sub_account_record IN
    SELECT sa.id, sa.organization_id, sa.is_main, o.seller_code as org_seller_code
    FROM sub_accounts sa
    LEFT JOIN organizations o ON sa.organization_id = o.id
    WHERE sa.seller_code IS NULL
  LOOP
    IF sub_account_record.is_main THEN
      -- 메인 서브계정: 조직의 seller_code 복사
      IF sub_account_record.org_seller_code IS NOT NULL THEN
        UPDATE sub_accounts
        SET seller_code = sub_account_record.org_seller_code
        WHERE id = sub_account_record.id;

        RAISE NOTICE '메인 서브계정 ID %: 조직 코드 복사 (%)',
          sub_account_record.id, sub_account_record.org_seller_code;
      ELSE
        RAISE WARNING '메인 서브계정 ID %: 조직에 seller_code가 없음', sub_account_record.id;
      END IF;
    ELSE
      -- 추가 서브계정: 새로운 SA 코드 생성
      FOR i IN 1..100 LOOP
        new_seller_code := 'SA' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

        -- 코드 중복 확인 (organizations와 sub_accounts 모두 확인)
        SELECT EXISTS(
          SELECT 1 FROM sub_accounts WHERE seller_code = new_seller_code
          UNION
          SELECT 1 FROM organizations WHERE seller_code = new_seller_code
        ) INTO code_exists;

        IF NOT code_exists THEN
          -- 중복이 없으면 업데이트하고 루프 종료
          UPDATE sub_accounts
          SET seller_code = new_seller_code
          WHERE id = sub_account_record.id;

          RAISE NOTICE '추가 서브계정 ID %: 새 코드 생성 (%)',
            sub_account_record.id, new_seller_code;
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ 기존 서브계정에 seller_code 생성 완료';
  RAISE NOTICE '================================================';
END $$;

-- 5. 새 서브계정 생성 시 자동으로 seller_code 생성하는 트리거
CREATE OR REPLACE FUNCTION generate_sub_account_seller_code()
RETURNS TRIGGER AS $$
DECLARE
  org_seller_code TEXT;
  new_seller_code TEXT;
  code_exists BOOLEAN;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  -- seller_code가 이미 있으면 그대로 사용
  IF NEW.seller_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 메인 서브계정인 경우: 조직의 seller_code 복사
  IF NEW.is_main THEN
    SELECT seller_code INTO org_seller_code
    FROM organizations
    WHERE id = NEW.organization_id;

    IF org_seller_code IS NOT NULL THEN
      NEW.seller_code := org_seller_code;
      RETURN NEW;
    ELSE
      RAISE WARNING '조직 ID %에 seller_code가 없습니다. 기본값 사용', NEW.organization_id;
      NEW.seller_code := 'S000000';
      RETURN NEW;
    END IF;
  END IF;

  -- 추가 서브계정인 경우: 고유한 SA 코드 생성
  LOOP
    attempt := attempt + 1;
    IF attempt > max_attempts THEN
      RAISE EXCEPTION 'seller_code 생성 실패: 최대 시도 횟수 초과';
    END IF;

    new_seller_code := 'SA' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- 중복 확인 (organizations와 sub_accounts 모두 확인)
    SELECT EXISTS(
      SELECT 1 FROM sub_accounts WHERE seller_code = new_seller_code
      UNION
      SELECT 1 FROM organizations WHERE seller_code = new_seller_code
    ) INTO code_exists;

    IF NOT code_exists THEN
      NEW.seller_code := new_seller_code;
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_generate_sub_account_seller_code ON sub_accounts;
CREATE TRIGGER trigger_generate_sub_account_seller_code
  BEFORE INSERT ON sub_accounts
  FOR EACH ROW
  EXECUTE FUNCTION generate_sub_account_seller_code();

-- 6. 조직의 seller_code 변경 시 메인 서브계정 동기화
CREATE OR REPLACE FUNCTION sync_main_sub_account_seller_code()
RETURNS TRIGGER AS $$
BEGIN
  -- 조직의 seller_code가 변경되면 메인 서브계정도 업데이트
  IF NEW.seller_code IS DISTINCT FROM OLD.seller_code THEN
    UPDATE sub_accounts
    SET seller_code = NEW.seller_code
    WHERE organization_id = NEW.id
      AND is_main = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_sync_main_sub_account_seller_code ON organizations;
CREATE TRIGGER trigger_sync_main_sub_account_seller_code
  AFTER UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION sync_main_sub_account_seller_code();

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ sub_accounts seller_code 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 기능:';
  RAISE NOTICE '- seller_code 칼럼 추가';
  RAISE NOTICE '- 메인 서브계정: 조직 seller_code 복사 (S123456)';
  RAISE NOTICE '- 추가 서브계정: 새 SA 코드 생성 (SA123456)';
  RAISE NOTICE '- 신규 서브계정 자동 코드 생성 트리거';
  RAISE NOTICE '- 조직 seller_code 변경 시 메인 서브계정 동기화';
  RAISE NOTICE '=================================================';
END $$;
