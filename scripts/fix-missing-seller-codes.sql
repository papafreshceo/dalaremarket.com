-- =====================================================
-- seller_code가 없는 서브계정에 코드 부여
-- =====================================================

-- 1. 현재 상태 확인
SELECT
  sa.id,
  sa.business_name,
  sa.is_main,
  sa.seller_code,
  o.seller_code as org_seller_code,
  o.business_name as org_name
FROM sub_accounts sa
LEFT JOIN organizations o ON sa.organization_id = o.id
WHERE sa.seller_code IS NULL
ORDER BY sa.is_main DESC, sa.id;

-- 2. seller_code가 없는 서브계정에 코드 생성
DO $$
DECLARE
  sub_account_record RECORD;
  org_seller_code TEXT;
  new_seller_code TEXT;
  code_exists BOOLEAN;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'seller_code가 없는 서브계정에 코드 생성 시작';
  RAISE NOTICE '================================================';

  -- seller_code가 없는 서브계정에 대해 처리
  FOR sub_account_record IN
    SELECT sa.id, sa.organization_id, sa.is_main, sa.business_name, o.seller_code as org_seller_code
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

        RAISE NOTICE '✅ 메인 서브계정 ID % (%): 조직 코드 복사 (%)',
          sub_account_record.id, sub_account_record.business_name, sub_account_record.org_seller_code;
      ELSE
        RAISE WARNING '⚠️ 메인 서브계정 ID % (%): 조직에 seller_code가 없음',
          sub_account_record.id, sub_account_record.business_name;
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

          RAISE NOTICE '✅ 추가 서브계정 ID % (%): 새 코드 생성 (%)',
            sub_account_record.id, sub_account_record.business_name, new_seller_code;
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ seller_code 생성 완료';
  RAISE NOTICE '================================================';
END $$;

-- 3. 결과 확인
SELECT
  sa.id,
  sa.business_name,
  sa.is_main,
  sa.seller_code,
  o.seller_code as org_seller_code,
  CASE
    WHEN sa.is_main THEN '메인 (조직 코드 복사)'
    ELSE '추가 (SA 코드 생성)'
  END as account_type
FROM sub_accounts sa
LEFT JOIN organizations o ON sa.organization_id = o.id
ORDER BY sa.organization_id, sa.is_main DESC, sa.id;
