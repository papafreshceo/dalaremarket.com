-- =====================================================
-- organization_members 테이블 동기화
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - users 테이블의 primary_organization_id를 기준으로
--   - organization_members에 멤버 레코드 생성
-- =====================================================

-- 1. primary_organization_id가 있는 사용자를 organization_members에 추가
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  status,
  can_manage_orders,
  can_manage_products,
  can_manage_members,
  can_view_financials,
  joined_at
)
SELECT
  u.primary_organization_id,
  u.id,
  'owner', -- 기본적으로 owner로 설정 (본인의 조직이므로)
  'active',
  true,
  true,
  true,
  true,
  NOW()
FROM users u
WHERE u.primary_organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = u.primary_organization_id
      AND om.user_id = u.id
  )
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  v_synced_count INTEGER;
  v_total_members INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_synced_count
  FROM organization_members
  WHERE created_at >= NOW() - INTERVAL '1 minute';

  SELECT COUNT(*) INTO v_total_members
  FROM organization_members;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organization_members 동기화 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '새로 추가된 멤버: %', v_synced_count;
  RAISE NOTICE '전체 멤버 수: %', v_total_members;
  RAISE NOTICE '=================================================';
END $$;
