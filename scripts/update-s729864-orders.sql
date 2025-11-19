-- S729864 조직의 주문 sub_account_id 업데이트

-- 1. 메인 서브계정 ID 확인
SELECT
  sa.id as sub_account_id,
  sa.business_name,
  sa.seller_code,
  o.id as org_id,
  o.business_name as org_name
FROM sub_accounts sa
JOIN organizations o ON sa.organization_id = o.id
WHERE o.seller_code = 'S729864'
  AND sa.is_main = true;

-- 2. S729864 조직의 주문 업데이트
UPDATE integrated_orders
SET sub_account_id = (
  SELECT sa.id
  FROM sub_accounts sa
  JOIN organizations o ON sa.organization_id = o.id
  WHERE o.seller_code = 'S729864'
    AND sa.is_main = true
  LIMIT 1
)
WHERE organization_id = (
  SELECT id FROM organizations WHERE seller_code = 'S729864'
)
AND sub_account_id IS NULL;

-- 3. 결과 확인
SELECT
  o.id,
  o.order_number,
  o.sub_account_id,
  o.shipping_status,
  sa.business_name as sub_account_name
FROM integrated_orders o
LEFT JOIN sub_accounts sa ON o.sub_account_id = sa.id
WHERE o.organization_id = (
  SELECT id FROM organizations WHERE seller_code = 'S729864'
)
ORDER BY o.created_at DESC
LIMIT 10;
