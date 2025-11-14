-- 서브 조직 삭제를 위한 CASCADE 설정 및 삭제 SQL (안전 버전)
-- 중복 생성된 서브 조직들을 정리하고, 향후 조직 삭제 시 관련 데이터도 자동 삭제되도록 설정
-- 존재하는 테이블만 처리

-- CASCADE 설정은 fix_organization_cascade_delete_safe.sql에서 처리하므로 여기서는 생략

-- 모든 서브 조직 삭제 (CASCADE로 인해 관련 데이터도 자동 삭제됨)
DO $$
DECLARE
  v_before_count INTEGER;
  v_after_count INTEGER;
  v_deleted_count INTEGER;
BEGIN
  -- 삭제 전 서브 조직 수 확인
  SELECT COUNT(*) INTO v_before_count
  FROM organizations
  WHERE is_main = false;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '서브 조직 삭제 시작';
  RAISE NOTICE '삭제 전 서브 조직 수: %', v_before_count;
  RAISE NOTICE '=================================================';

  -- 서브 조직 삭제
  DELETE FROM organizations WHERE is_main = false;

  -- 삭제 후 확인
  SELECT COUNT(*) INTO v_after_count
  FROM organizations
  WHERE is_main = false;

  v_deleted_count := v_before_count - v_after_count;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 서브 조직 삭제 완료';
  RAISE NOTICE '삭제된 서브 조직 수: %', v_deleted_count;
  RAISE NOTICE '남은 서브 조직 수: %', v_after_count;
  RAISE NOTICE '=================================================';
END $$;

-- 결과 확인 쿼리
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '조직 현황:';
  RAISE NOTICE '=================================================';

  FOR rec IN
    SELECT
      owner_id,
      COUNT(*) as total_orgs,
      COUNT(*) FILTER (WHERE is_main = true) as main_count,
      COUNT(*) FILTER (WHERE is_main = false) as sub_count
    FROM organizations
    GROUP BY owner_id
    ORDER BY total_orgs DESC
    LIMIT 10
  LOOP
    RAISE NOTICE 'Owner: % | Total: % | Main: % | Sub: %',
      rec.owner_id, rec.total_orgs, rec.main_count, rec.sub_count;
  END LOOP;

  RAISE NOTICE '=================================================';
END $$;
