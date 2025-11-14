-- test2를 organization_members에 추가

INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at,
  can_manage_members,
  can_manage_orders,
  can_manage_products,
  can_view_financials
)
VALUES (
  '109602e2-e0ac-4eef-b548-7bd77a08c341',
  '433b4a97-1d16-47c3-8490-29341d9819d1',
  'owner',
  'active',
  NOW(),
  true,
  true,
  true,
  true
)
ON CONFLICT DO NOTHING;
