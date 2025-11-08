-- 주문통합(Excel) 도구 업데이트 (이미 존재하면 업데이트, 없으면 추가)

INSERT INTO tools_master (
  id,
  name,
  description,
  category,
  credits_required,
  is_active,
  is_premium,
  icon_gradient,
  display_order,
  billing_type,
  action_buttons
) VALUES (
  'order-integration',
  '주문통합(Excel)',
  '여러 마켓의 주문 파일을 업로드하고 하나로 통합',
  'essential',
  0, -- on_action이므로 0
  true,
  false,
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  10,
  'on_action',
  '[
    {"id": "integrate", "label": "통합하기", "credits": 5},
    {"id": "download", "label": "템플릿 다운로드", "credits": 1}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  credits_required = EXCLUDED.credits_required,
  is_active = EXCLUDED.is_active,
  is_premium = EXCLUDED.is_premium,
  icon_gradient = EXCLUDED.icon_gradient,
  display_order = EXCLUDED.display_order,
  billing_type = EXCLUDED.billing_type,
  action_buttons = EXCLUDED.action_buttons,
  updated_at = NOW();

-- 확인
SELECT id, name, billing_type, action_buttons
FROM tools_master
WHERE id = 'order-integration';
