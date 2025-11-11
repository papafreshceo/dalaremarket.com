-- =====================================================
-- 옵션명 매핑 설정을 조직(Organization) 단위로 전환
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: 개인 단위 옵션명 매핑을 조직 단위로 통합
--       - 조직의 모든 멤버가 같은 옵션명 매핑 사용
-- =====================================================

-- 1. option_name_mappings에 organization_id 추가
ALTER TABLE option_name_mappings
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_option_name_mappings_organization_id
  ON option_name_mappings(organization_id);

COMMENT ON COLUMN option_name_mappings.organization_id IS '매핑이 속한 조직';

-- 2. 기존 데이터에 organization_id 설정
UPDATE option_name_mappings onm
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE id = onm.seller_id
)
WHERE organization_id IS NULL;

-- 3. UNIQUE 제약조건 변경 (seller_id → organization_id)
-- 기존 제약조건 삭제
ALTER TABLE option_name_mappings
DROP CONSTRAINT IF EXISTS option_name_mappings_seller_id_user_option_name_key;

-- 새로운 제약조건 추가 (조직 단위)
ALTER TABLE option_name_mappings
ADD CONSTRAINT unique_organization_user_option_name
  UNIQUE(organization_id, user_option_name);

-- 4. 같은 조직의 중복 매핑 통합 (owner의 매핑만 유지)
DO $$
DECLARE
  v_org_id UUID;
  v_user_option_name TEXT;
  v_owner_id UUID;
  v_owner_mapping_id BIGINT;
BEGIN
  -- 각 조직별, 옵션명별로 처리
  FOR v_org_id, v_user_option_name IN
    SELECT DISTINCT organization_id, user_option_name
    FROM option_name_mappings
    WHERE organization_id IS NOT NULL
  LOOP
    -- 해당 조직의 owner ID 찾기
    SELECT owner_id INTO v_owner_id
    FROM organizations
    WHERE id = v_org_id;

    -- owner의 매핑 레코드 ID 찾기
    SELECT id INTO v_owner_mapping_id
    FROM option_name_mappings
    WHERE organization_id = v_org_id
      AND user_option_name = v_user_option_name
      AND seller_id = v_owner_id
    LIMIT 1;

    -- owner 매핑이 없으면 첫 번째 레코드를 owner 것으로 간주
    IF v_owner_mapping_id IS NULL THEN
      SELECT id INTO v_owner_mapping_id
      FROM option_name_mappings
      WHERE organization_id = v_org_id
        AND user_option_name = v_user_option_name
      LIMIT 1;

      -- seller_id를 owner로 변경
      UPDATE option_name_mappings
      SET seller_id = v_owner_id
      WHERE id = v_owner_mapping_id;
    END IF;

    -- owner 레코드를 제외한 나머지 삭제
    DELETE FROM option_name_mappings
    WHERE organization_id = v_org_id
      AND user_option_name = v_user_option_name
      AND id != v_owner_mapping_id;
  END LOOP;
END $$;

-- 5. RLS 정책 업데이트 (조직 기반)
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can create their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can update their own option name mappings" ON option_name_mappings;
DROP POLICY IF EXISTS "Users can delete their own option name mappings" ON option_name_mappings;

-- 새로운 정책: 조직 멤버는 조직 매핑 조회 가능
CREATE POLICY "Organization members can view organization option mappings"
  ON option_name_mappings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 조직 관리자는 매핑 생성 가능
CREATE POLICY "Organization admins can create option mappings"
  ON option_name_mappings FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- 조직 관리자는 매핑 수정 가능
CREATE POLICY "Organization admins can update option mappings"
  ON option_name_mappings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- 조직 관리자는 매핑 삭제 가능
CREATE POLICY "Organization admins can delete option mappings"
  ON option_name_mappings FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  v_mapping_count INTEGER;
  v_org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mapping_count FROM option_name_mappings WHERE organization_id IS NOT NULL;
  SELECT COUNT(DISTINCT organization_id) INTO v_org_count FROM option_name_mappings WHERE organization_id IS NOT NULL;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '옵션명 매핑 조직 단위 전환 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '매핑 레코드 수: %', v_mapping_count;
  RAISE NOTICE '조직 수: %', v_org_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 조직 멤버 모두가 같은 옵션명 매핑 사용';
  RAISE NOTICE '- 관리자만 매핑 생성/수정/삭제 가능';
  RAISE NOTICE '- RLS 정책을 조직 기반으로 변경';
  RAISE NOTICE '=================================================';
END $$;
