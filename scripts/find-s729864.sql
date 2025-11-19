-- S729864 셀러코드 찾기

-- 1. organizations 테이블에서 찾기
SELECT 'organizations' as table_name, *
FROM organizations
WHERE seller_code = 'S729864';

-- 2. sub_accounts 테이블에서 찾기
SELECT 'sub_accounts' as table_name, *
FROM sub_accounts
WHERE seller_code = 'S729864';

-- 3. 모든 조직의 business_name 확인 (최근 20개)
SELECT
  id,
  business_name,
  seller_code,
  business_number,
  representative_name,
  created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 20;

-- 4. S729864와 관련된 주문이 있는지 확인
SELECT
  o.id,
  o.order_number,
  o.organization_id,
  o.sub_account_id,
  org.business_name as org_business_name,
  org.seller_code as org_seller_code,
  sa.business_name as sub_business_name,
  sa.seller_code as sub_seller_code
FROM integrated_orders o
LEFT JOIN organizations org ON o.organization_id = org.id
LEFT JOIN sub_accounts sa ON o.sub_account_id = sa.id
WHERE org.seller_code = 'S729864' OR sa.seller_code = 'S729864'
LIMIT 10;
