-- optional_product 타입의 상태 데이터 추가

INSERT INTO supply_status_settings (status_type, code, name, color, display_order, is_active)
VALUES
  ('optional_product', 'PREPARING', '준비중', '#9CA3AF', 1, true),
  ('optional_product', 'SUPPLYING', '공급중', '#10B981', 2, true),
  ('optional_product', 'PAUSED', '일시중지', '#F59E0B', 3, true),
  ('optional_product', 'STOPPED', '중단', '#EF4444', 4, true),
  ('optional_product', 'SEASON_END', '시즌종료', '#6B7280', 5, true)
ON CONFLICT (status_type, code) DO NOTHING;
