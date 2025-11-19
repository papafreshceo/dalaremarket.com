-- 093: option_name_mappings UNIQUE 제약조건 수정
-- (organization_id, user_option_name) -> (organization_id, site_option_name)

-- 기존 제약조건 삭제
ALTER TABLE option_name_mappings
DROP CONSTRAINT IF EXISTS unique_organization_user_option_name;

ALTER TABLE option_name_mappings
DROP CONSTRAINT IF EXISTS option_name_mappings_seller_id_user_option_name_key;

-- 올바른 제약조건 추가
-- 각 조직에서 각 표준 옵션명(site_option_name)은 하나의 판매자 옵션명(user_option_name)만 가질 수 있음
ALTER TABLE option_name_mappings
ADD CONSTRAINT unique_organization_site_option_name
  UNIQUE(organization_id, site_option_name);

COMMENT ON CONSTRAINT unique_organization_site_option_name ON option_name_mappings
  IS '각 조직에서 표준 옵션명은 하나의 판매자 옵션명만 매핑 가능';
