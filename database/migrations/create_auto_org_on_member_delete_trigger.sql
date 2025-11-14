-- =====================================================
-- 조직 멤버 삭제 시 개인 셀러계정 자동 생성 트리거
-- =====================================================
-- 작성일: 2025-01-13
-- 설명: 조직 소유자가 조직을 삭제하면, CASCADE DELETE로
--       멤버들이 자동 삭제되는데, 이때 각 멤버에게
--       개인 셀러계정을 자동 생성해주는 트리거
-- =====================================================

-- 트리거 함수: 멤버 삭제 시 개인 셀러계정 생성
CREATE OR REPLACE FUNCTION auto_create_personal_org_on_member_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
  v_new_org_id UUID;
  v_new_org_name TEXT;
  v_user_role TEXT;
BEGIN
  -- 삭제되는 멤버가 소유자가 아니고, active 상태인 경우만 처리
  IF OLD.role != 'owner' AND OLD.status = 'active' THEN

    -- 사용자 정보 조회
    SELECT name, email, role INTO v_user_name, v_user_email, v_user_role
    FROM users
    WHERE id = OLD.user_id;

    -- 관리자 계정은 개인 셀러계정 생성 안 함
    IF v_user_role IN ('admin', 'super_admin', 'employee') THEN
      RAISE NOTICE '관리자 계정 - 개인 셀러계정 생성 스킵: %', v_user_email;
      RETURN OLD;
    END IF;

    -- 사용자가 다른 active 멤버십을 가지고 있는지 확인
    -- (동시에 여러 조직의 멤버인 경우, 개인 셀러계정 생성 안 함)
    IF EXISTS (
      SELECT 1
      FROM organization_members
      WHERE user_id = OLD.user_id
        AND id != OLD.id
        AND status = 'active'
    ) THEN
      RAISE NOTICE '다른 active 멤버십 존재 - 개인 셀러계정 생성 스킵: %', v_user_email;
      RETURN OLD;
    END IF;

    -- 개인 셀러계정명 생성
    v_new_org_name := COALESCE(v_user_name, v_user_email) || ' 셀러계정';

    RAISE NOTICE '개인 셀러계정 자동 생성 시작: % for user %', v_new_org_name, v_user_email;

    -- 새 개인 조직 생성
    INSERT INTO organizations (
      owner_id,
      business_name,
      is_active,
      tier,
      created_at,
      updated_at
    ) VALUES (
      OLD.user_id,
      v_new_org_name,
      true,
      'light',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_new_org_id;

    -- 새 조직에 소유자로 멤버 추가
    INSERT INTO organization_members (
      organization_id,
      user_id,
      role,
      status,
      joined_at,
      can_manage_members,
      can_manage_products,
      can_manage_orders,
      can_view_financials
    ) VALUES (
      v_new_org_id,
      OLD.user_id,
      'owner',
      'active',
      NOW(),
      true,
      true,
      true,
      true
    );

    -- 사용자의 primary_organization_id 업데이트
    UPDATE users
    SET primary_organization_id = v_new_org_id,
        updated_at = NOW()
    WHERE id = OLD.user_id;

    RAISE NOTICE '✅ 개인 셀러계정 생성 완료: org_id=%', v_new_org_id;

  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 (있을 경우)
DROP TRIGGER IF EXISTS trg_auto_create_personal_org_on_member_delete ON organization_members;

-- 트리거 생성 (BEFORE DELETE)
CREATE TRIGGER trg_auto_create_personal_org_on_member_delete
  BEFORE DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_personal_org_on_member_delete();

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 조직 멤버 삭제 시 개인 셀러계정 자동 생성 트리거 설치 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '트리거 이름: trg_auto_create_personal_org_on_member_delete';
  RAISE NOTICE '동작: organization_members 삭제 시 자동 실행';
  RAISE NOTICE '조건:';
  RAISE NOTICE '  - 소유자가 아닌 멤버 (role != owner)';
  RAISE NOTICE '  - active 상태인 멤버';
  RAISE NOTICE '  - 다른 active 멤버십이 없는 사용자';
  RAISE NOTICE '  - 일반 회원 (admin/super_admin/employee 제외)';
  RAISE NOTICE '결과: 개인 셀러계정 자동 생성 + primary_organization_id 업데이트';
  RAISE NOTICE '=================================================';
END $$;
