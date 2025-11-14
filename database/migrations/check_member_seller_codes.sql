-- =====================================================
-- 담당자 셀러코드 정리 확인 쿼리
-- =====================================================

-- 1. 다른 사람의 조직에 담당자로 소속된 회원 중 셀러코드가 있는 회원 조회
SELECT
  u.id,
  u.email,
  u.name,
  u.seller_code,
  u.partner_code,
  o.name as organization_name,
  o.owner_id,
  om.role
FROM users u
INNER JOIN organization_members om ON u.id = om.user_id
INNER JOIN organizations o ON om.organization_id = o.id
WHERE om.status = 'active'
  AND o.owner_id != u.id  -- 본인이 소유자가 아닌 조직
  AND (u.seller_code IS NOT NULL OR u.partner_code IS NOT NULL)
ORDER BY u.email;

-- 2. 전체 담당자 수 (셀러코드 유무 관계없이)
SELECT
  COUNT(DISTINCT u.id) as total_members,
  COUNT(DISTINCT CASE WHEN u.seller_code IS NOT NULL OR u.partner_code IS NOT NULL THEN u.id END) as members_with_codes
FROM users u
INNER JOIN organization_members om ON u.id = om.user_id
INNER JOIN organizations o ON om.organization_id = o.id
WHERE om.status = 'active'
  AND o.owner_id != u.id;
