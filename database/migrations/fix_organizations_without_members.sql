-- =====================================================
-- 멤버 없는 조직에 owner를 멤버로 추가
-- =====================================================

-- 멤버가 없는 조직의 owner를 organization_members에 추가
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at,
  can_manage_orders,
  can_manage_products,
  can_manage_members,
  can_view_financials,
  created_at,
  updated_at
)
SELECT
  o.id as organization_id,
  o.owner_id as user_id,
  'owner' as role,
  'active' as status,
  o.created_at as joined_at,
  true as can_manage_orders,
  true as can_manage_products,
  true as can_manage_members,
  true as can_view_financials,
  NOW() as created_at,
  NOW() as updated_at
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM organization_members om
  WHERE om.organization_id = o.id
)
AND o.owner_id IS NOT NULL;

-- 결과 출력
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE '✅ 수정 완료: % 개 조직에 owner 멤버 추가', fixed_count;
END $$;
