-- =====================================================
-- 서브 계정 시스템 제거 및 단순화
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - 서브 계정 시스템 완전 제거
--   - organizations는 계정 1개만 (is_main, parent_organization_id 제거)
--   - 사업자 정보는 business_profiles 테이블로 관리
-- =====================================================

-- 1. 서브 조직 모두 삭제 (CASCADE로 관련 데이터 자동 삭제)
DO $$
DECLARE
  sub_count INTEGER;
BEGIN
  -- 서브 조직 수 확인
  SELECT COUNT(*) INTO sub_count
  FROM organizations
  WHERE is_main = false OR parent_organization_id IS NOT NULL;

  IF sub_count > 0 THEN
    RAISE NOTICE '⚠️  % 개의 서브 조직 삭제 중...', sub_count;

    -- 서브 조직 삭제
    DELETE FROM organizations
    WHERE is_main = false OR parent_organization_id IS NOT NULL;

    RAISE NOTICE '✅ % 개의 서브 조직 삭제 완료', sub_count;
  ELSE
    RAISE NOTICE '✅ 삭제할 서브 조직이 없습니다.';
  END IF;
END $$;

-- 2. 제약 조건 제거
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS check_sub_has_parent;

-- 한 소유자당 하나의 메인 계정만 허용하는 인덱스 제거
DROP INDEX IF EXISTS idx_one_main_per_owner;

-- 3. 불필요한 컬럼 제거
ALTER TABLE organizations
DROP COLUMN IF EXISTS is_main,
DROP COLUMN IF EXISTS parent_organization_id;

-- 4. 관련 인덱스 제거
DROP INDEX IF EXISTS idx_organizations_parent_id;
DROP INDEX IF EXISTS idx_organizations_is_main;

-- 5. 각 소유자당 조직 1개만 허용하는 제약 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_organization_per_owner
ON organizations(owner_id);

-- 6. 기존 중복 조직 확인 및 처리
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- 중복 소유자 수 확인
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT owner_id, COUNT(*) as org_count
    FROM organizations
    GROUP BY owner_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠️  % 명의 사용자가 여러 조직 소유', duplicate_count;
    RAISE NOTICE '각 사용자의 가장 오래된 조직만 유지하고 나머지 삭제합니다...';

    -- 각 owner의 가장 오래된 조직만 남기고 나머지 삭제
    DELETE FROM organizations
    WHERE id IN (
      SELECT id
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
        FROM organizations
      ) ranked
      WHERE rn > 1
    );

    RAISE NOTICE '✅ 중복 조직 정리 완료';
  ELSE
    RAISE NOTICE '✅ 중복 조직이 없습니다.';
  END IF;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 서브 계정 시스템 제거 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 모든 서브 조직 삭제';
  RAISE NOTICE '- is_main, parent_organization_id 컬럼 제거';
  RAISE NOTICE '- 한 소유자당 조직 1개만 허용';
  RAISE NOTICE '- 사업자 정보는 business_profiles로 관리';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '새로운 구조:';
  RAISE NOTICE '- 조직(계정): 1개 (캐시/크레딧/점수 관리)';
  RAISE NOTICE '- 사업자 정보: 여러 개 가능 (발주/정산용)';
  RAISE NOTICE '- 기본 사업자: organizations 테이블 정보';
  RAISE NOTICE '- 추가 사업자: business_profiles 테이블';
  RAISE NOTICE '=================================================';
END $$;
