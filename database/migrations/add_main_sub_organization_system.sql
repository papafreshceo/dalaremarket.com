-- =====================================================
-- 메인/서브 셀러계정 시스템 구축
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - 한 소유자가 여러 사업자번호를 운영할 수 있도록 지원
--   - 메인 계정: 캐시/크레딧/기여점수/티어 관리
--   - 서브 계정: 사업자 정보만 별도 관리 (발주/정산 분리용)
--   - 멤버는 메인 계정에만 소속, 모든 서브 계정 접근 가능
-- =====================================================

-- 1. organizations 테이블에 필드 추가
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- 2. 중복 소유자 확인 및 처리
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
    RAISE NOTICE '각 사용자의 가장 오래된 조직을 메인으로 설정합니다...';
  END IF;
END $$;

-- 3. 각 owner의 가장 오래된 조직을 메인으로 설정
WITH ranked_orgs AS (
  SELECT
    id,
    owner_id,
    ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
  FROM organizations
)
UPDATE organizations o
SET is_main = true
FROM ranked_orgs r
WHERE o.id = r.id AND r.rn = 1;

-- 4. 나머지 조직들을 서브로 설정하고 parent 연결
WITH main_orgs AS (
  SELECT owner_id, id as main_id
  FROM organizations
  WHERE is_main = true
)
UPDATE organizations o
SET
  is_main = false,
  parent_organization_id = m.main_id
FROM main_orgs m
WHERE o.owner_id = m.owner_id
  AND o.is_main = false
  AND o.parent_organization_id IS NULL;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_is_main ON organizations(is_main);

-- 6. 제약 조건: 한 소유자당 하나의 메인 계정만
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_main_per_owner
ON organizations(owner_id)
WHERE is_main = true;

-- 5. 제약 조건: 서브는 반드시 parent가 있어야 함
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS check_sub_has_parent;

ALTER TABLE organizations
ADD CONSTRAINT check_sub_has_parent
CHECK (
  (is_main = true AND parent_organization_id IS NULL) OR
  (is_main = false AND parent_organization_id IS NOT NULL)
);

-- 6. 코멘트 추가
COMMENT ON COLUMN organizations.parent_organization_id IS '상위 조직 ID (서브 계정인 경우 메인 계정 ID)';
COMMENT ON COLUMN organizations.is_main IS '메인 계정 여부 (true: 메인, false: 서브)';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 메인/서브 셀러계정 시스템 구축 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- parent_organization_id 필드 추가';
  RAISE NOTICE '- is_main 필드 추가';
  RAISE NOTICE '- 기존 조직들은 모두 메인으로 설정';
  RAISE NOTICE '- 한 소유자당 하나의 메인 계정만 허용';
  RAISE NOTICE '- 서브 계정은 반드시 메인 계정 참조 필수';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '사용 방법:';
  RAISE NOTICE '- 메인 계정: 캐시/크레딧/기여점수/티어/멤버 관리';
  RAISE NOTICE '- 서브 계정: 발주/정산 시 사업자 정보 분리용';
  RAISE NOTICE '- 서브 계정에서 발주해도 점수는 메인으로 적립';
  RAISE NOTICE '=================================================';
END $$;
