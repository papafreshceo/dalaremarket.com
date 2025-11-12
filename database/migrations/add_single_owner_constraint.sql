-- =====================================================
-- 한 사용자는 한 소유자의 조직에만 속할 수 있도록 제약
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - 사용자가 여러 조직의 멤버가 될 수 있지만
--   - 모든 조직은 같은 소유자(owner)여야 함
--   - 다른 소유자의 조직에는 속할 수 없음
-- =====================================================

-- 1. 제약 조건을 확인하는 함수 생성
CREATE OR REPLACE FUNCTION check_single_owner_membership()
RETURNS TRIGGER AS $$
DECLARE
  v_new_org_owner_id UUID;
  v_existing_org_owner_id UUID;
BEGIN
  -- 새로 추가되는 조직의 소유자 조회
  SELECT owner_id INTO v_new_org_owner_id
  FROM organizations
  WHERE id = NEW.organization_id;

  -- 해당 사용자가 이미 속한 조직들의 소유자 조회
  SELECT DISTINCT o.owner_id INTO v_existing_org_owner_id
  FROM organization_members om
  INNER JOIN organizations o ON om.organization_id = o.id
  WHERE om.user_id = NEW.user_id
    AND om.status = 'active'
    AND om.organization_id != NEW.organization_id
  LIMIT 1;

  -- 다른 소유자의 조직에 이미 속해 있으면 에러
  IF v_existing_org_owner_id IS NOT NULL
     AND v_existing_org_owner_id != v_new_org_owner_id THEN
    RAISE EXCEPTION '이미 다른 소유자의 셀러계정 멤버입니다. 한 사람의 셀러계정에만 소속될 수 있습니다.'
      USING HINT = 'existing_owner: ' || v_existing_org_owner_id || ', new_owner: ' || v_new_org_owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성 (이미 존재하면 먼저 삭제)
DROP TRIGGER IF EXISTS check_single_owner_membership_trigger ON organization_members;

CREATE TRIGGER check_single_owner_membership_trigger
  BEFORE INSERT OR UPDATE ON organization_members
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_single_owner_membership();

-- 3. 기존 데이터 검증 (충돌하는 멤버십이 있는지 확인)
DO $$
DECLARE
  v_conflict_count INTEGER;
  v_conflict_users TEXT;
BEGIN
  -- 충돌하는 멤버십 수 확인
  SELECT COUNT(DISTINCT om.user_id) INTO v_conflict_count
  FROM organization_members om
  INNER JOIN organizations o1 ON om.organization_id = o1.id
  WHERE om.status = 'active'
    AND EXISTS (
      SELECT 1
      FROM organization_members om2
      INNER JOIN organizations o2 ON om2.organization_id = o2.id
      WHERE om2.user_id = om.user_id
        AND om2.status = 'active'
        AND om2.organization_id != om.organization_id
        AND o2.owner_id != o1.owner_id
    );

  IF v_conflict_count > 0 THEN
    -- 충돌하는 사용자 목록 생성
    SELECT STRING_AGG(DISTINCT u.email, ', ') INTO v_conflict_users
    FROM organization_members om
    INNER JOIN organizations o1 ON om.organization_id = o1.id
    INNER JOIN users u ON om.user_id = u.id
    WHERE om.status = 'active'
      AND EXISTS (
        SELECT 1
        FROM organization_members om2
        INNER JOIN organizations o2 ON om2.organization_id = o2.id
        WHERE om2.user_id = om.user_id
          AND om2.status = 'active'
          AND om2.organization_id != om.organization_id
          AND o2.owner_id != o1.owner_id
      );

    RAISE NOTICE '⚠️  경고: % 명의 사용자가 여러 소유자의 조직에 속해 있습니다', v_conflict_count;
    RAISE NOTICE '충돌하는 사용자: %', v_conflict_users;
    RAISE NOTICE '수동으로 데이터를 정리해야 합니다.';
  ELSE
    RAISE NOTICE '✅ 기존 데이터 검증 완료: 충돌하는 멤버십 없음';
  END IF;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 단일 소유자 제약 조건 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- check_single_owner_membership() 함수 생성';
  RAISE NOTICE '- organization_members 테이블에 트리거 추가';
  RAISE NOTICE '- 한 사용자는 한 소유자의 조직에만 속할 수 있음';
  RAISE NOTICE '=================================================';
END $$;
