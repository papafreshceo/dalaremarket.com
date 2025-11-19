-- =====================================================
-- 서브계정-조직 동기화 상태 점검
-- =====================================================

-- 1. 서브계정이 없는 조직 확인
SELECT
  o.id as org_id,
  o.business_name as org_business_name,
  o.seller_code as org_seller_code,
  'NO_SUB_ACCOUNT' as issue
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
)
ORDER BY o.created_at DESC
LIMIT 10;

-- 2. 메인 서브계정의 동기화 상태 확인
SELECT
  o.id as org_id,
  o.business_name as org_business_name,
  o.business_number as org_business_number,
  o.seller_code as org_seller_code,
  sa.id as sub_id,
  sa.business_name as sub_business_name,
  sa.business_number as sub_business_number,
  sa.seller_code as sub_seller_code,
  sa.is_main,
  CASE
    WHEN sa.business_name IS NULL OR sa.business_name = '' THEN '❌ 사업자명 없음'
    WHEN sa.business_name != o.business_name THEN '⚠️ 사업자명 불일치'
    WHEN sa.seller_code IS NULL THEN '❌ 셀러코드 없음'
    WHEN sa.seller_code != o.seller_code THEN '⚠️ 셀러코드 불일치'
    ELSE '✅ 정상'
  END as sync_status
FROM organizations o
LEFT JOIN sub_accounts sa ON sa.organization_id = o.id AND sa.is_main = true
ORDER BY o.created_at DESC
LIMIT 20;

-- 3. 통계
SELECT
  '전체 조직' as category,
  COUNT(*) as count
FROM organizations
UNION ALL
SELECT
  '서브계정 없는 조직' as category,
  COUNT(*) as count
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM sub_accounts sa WHERE sa.organization_id = o.id
)
UNION ALL
SELECT
  '메인 서브계정 사업자명 없음' as category,
  COUNT(*) as count
FROM sub_accounts sa
WHERE sa.is_main = true
  AND (sa.business_name IS NULL OR sa.business_name = '')
UNION ALL
SELECT
  '메인 서브계정 셀러코드 없음' as category,
  COUNT(*) as count
FROM sub_accounts sa
WHERE sa.is_main = true
  AND sa.seller_code IS NULL;

-- 4. 트리거 존재 확인
SELECT
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'organizations'::regclass
  AND tgname LIKE '%sync%';
