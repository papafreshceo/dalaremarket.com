-- =====================================================
-- 동기화 결과 확인
-- =====================================================

-- 1. 전체 통계
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

-- 2. 최근 생성된 조직의 메인 서브계정 확인 (최근 10개)
SELECT
  o.business_name as "조직명",
  o.seller_code as "조직_셀러코드",
  sa.business_name as "서브계정_사업자명",
  sa.seller_code as "서브계정_셀러코드",
  sa.is_main as "메인여부",
  CASE
    WHEN sa.business_name IS NULL OR sa.business_name = '' THEN '❌'
    WHEN sa.seller_code IS NULL THEN '❌'
    WHEN sa.business_name = o.business_name AND sa.seller_code = o.seller_code THEN '✅'
    ELSE '⚠️'
  END as "상태"
FROM organizations o
LEFT JOIN sub_accounts sa ON sa.organization_id = o.id AND sa.is_main = true
ORDER BY o.created_at DESC
LIMIT 10;
