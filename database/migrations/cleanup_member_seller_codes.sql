-- =====================================================
-- 담당자(멤버) 회원의 셀러계정 코드 정리
-- =====================================================
-- 목적: 다른 사람의 조직에 담당자로 소속된 회원의
--       개인 셀러계정 코드(seller_code, partner_code)를 삭제
-- =====================================================

DO $$
DECLARE
  v_member_count INTEGER := 0;
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '담당자 셀러코드 정리 시작';
  RAISE NOTICE '=================================================';

  -- 1. 다른 사람의 조직에 담당자로 소속된 회원 찾기
  -- (본인이 소유자가 아닌 조직의 멤버)
  SELECT COUNT(DISTINCT u.id) INTO v_member_count
  FROM users u
  INNER JOIN organization_members om ON u.id = om.user_id
  INNER JOIN organizations o ON om.organization_id = o.id
  WHERE om.status = 'active'
    AND o.owner_id != u.id  -- 본인이 소유자가 아닌 조직
    AND (u.seller_code IS NOT NULL OR u.partner_code IS NOT NULL);

  RAISE NOTICE '셀러코드가 있는 담당자 회원 수: %', v_member_count;

  -- 2. 담당자 회원의 셀러코드 삭제
  UPDATE users u
  SET
    seller_code = NULL,
    partner_code = NULL
  FROM organization_members om
  INNER JOIN organizations o ON om.organization_id = o.id
  WHERE u.id = om.user_id
    AND om.status = 'active'
    AND o.owner_id != u.id  -- 본인이 소유자가 아닌 조직
    AND (u.seller_code IS NOT NULL OR u.partner_code IS NOT NULL);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 담당자 셀러코드 정리 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '업데이트된 회원 수: %', v_updated_count;
  RAISE NOTICE '=================================================';

  -- 3. 정리 결과 확인
  RAISE NOTICE '정리 후 확인:';

  -- 여전히 셀러코드가 남아있는 담당자가 있는지 확인
  SELECT COUNT(DISTINCT u.id) INTO v_member_count
  FROM users u
  INNER JOIN organization_members om ON u.id = om.user_id
  INNER JOIN organizations o ON om.organization_id = o.id
  WHERE om.status = 'active'
    AND o.owner_id != u.id
    AND (u.seller_code IS NOT NULL OR u.partner_code IS NOT NULL);

  IF v_member_count > 0 THEN
    RAISE NOTICE '⚠️ 여전히 셀러코드가 있는 담당자: % 명', v_member_count;
  ELSE
    RAISE NOTICE '✅ 모든 담당자의 셀러코드가 정리되었습니다';
  END IF;

  RAISE NOTICE '=================================================';
END $$;
