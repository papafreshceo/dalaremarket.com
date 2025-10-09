-- 거래처 추가
INSERT INTO partners (name, code, is_active, created_at, updated_at)
VALUES
  ('달래마켓', 'DALRAE', true, now(), now()),
  ('사계절농장', 'SAGYE', true, now(), now())
ON CONFLICT (code) DO NOTHING;
