-- =====================================================
-- 기존 주문의 sub_account_id 업데이트
-- =====================================================
-- 설명:
--   - sub_account_id가 NULL인 주문들을
--   - 해당 조직의 메인 서브계정 ID로 업데이트
-- =====================================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_org RECORD;
  v_main_sub_account_id UUID;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '기존 주문의 sub_account_id 업데이트 시작';
  RAISE NOTICE '================================================';

  -- organization_id가 있고 sub_account_id가 NULL인 주문 처리
  FOR v_org IN
    SELECT DISTINCT organization_id
    FROM integrated_orders
    WHERE organization_id IS NOT NULL
      AND sub_account_id IS NULL
  LOOP
    -- 해당 조직의 메인 서브계정 찾기
    SELECT id INTO v_main_sub_account_id
    FROM sub_accounts
    WHERE organization_id = v_org.organization_id
      AND is_main = true
    LIMIT 1;

    -- 메인 서브계정이 있으면 업데이트
    IF v_main_sub_account_id IS NOT NULL THEN
      UPDATE integrated_orders
      SET sub_account_id = v_main_sub_account_id
      WHERE organization_id = v_org.organization_id
        AND sub_account_id IS NULL;

      GET DIAGNOSTICS v_updated_count = ROW_COUNT;

      RAISE NOTICE '✅ 조직 %: %개 주문 업데이트', v_org.organization_id, v_updated_count;
    ELSE
      RAISE WARNING '⚠️ 조직 %: 메인 서브계정이 없습니다', v_org.organization_id;
    END IF;
  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ 주문 sub_account_id 업데이트 완료';
  RAISE NOTICE '================================================';
END $$;

-- 검증
SELECT
  COUNT(*) as total_orders,
  COUNT(sub_account_id) as with_sub_account,
  COUNT(*) - COUNT(sub_account_id) as without_sub_account
FROM integrated_orders
WHERE organization_id IS NOT NULL;
