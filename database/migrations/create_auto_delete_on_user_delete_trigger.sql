-- 유저 삭제 시 조직과 auth 자동 삭제 트리거
-- users 테이블에서 유저를 삭제하면 자동으로:
-- 1. 해당 유저가 소유한 조직 삭제 (CASCADE로 관련 데이터도 삭제됨)
-- 2. auth.users에서도 삭제

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION auto_delete_user_related_data()
RETURNS TRIGGER AS $$
DECLARE
  deleted_org_count INTEGER;
BEGIN
  -- 1. 해당 유저가 소유한 조직만 삭제 (ON DELETE CASCADE로 관련 데이터도 삭제됨)
  DELETE FROM organizations
  WHERE owner_id = OLD.id;

  GET DIAGNOSTICS deleted_org_count = ROW_COUNT;

  -- 2. auth.users에서도 삭제
  DELETE FROM auth.users
  WHERE id = OLD.id;

  IF deleted_org_count > 0 THEN
    RAISE NOTICE '유저 % 삭제: % 개의 셀러계정(조직) 및 auth 데이터 자동 삭제 완료', OLD.id, deleted_org_count;
  ELSE
    RAISE NOTICE '유저 % 삭제: 소유한 셀러계정 없음, auth 데이터만 삭제 완료', OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성 (BEFORE DELETE로 설정)
DROP TRIGGER IF EXISTS trigger_auto_delete_user_data ON users;

CREATE TRIGGER trigger_auto_delete_user_data
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_delete_user_related_data();

COMMENT ON FUNCTION auto_delete_user_related_data() IS 'users 테이블에서 유저 삭제 시 소유 조직 및 auth 자동 삭제';
COMMENT ON TRIGGER trigger_auto_delete_user_data ON users IS '유저 삭제 시 조직과 auth.users 자동 삭제 트리거';
