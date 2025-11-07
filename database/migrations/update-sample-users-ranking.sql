-- 샘플 회원들을 랭킹 참여 상태로 설정

-- 1. 샘플 회원들 확인 (email에 'sample' 또는 'test' 포함)
SELECT id, email, name, role
FROM users
WHERE email ILIKE '%sample%' OR email ILIKE '%test%';

-- 2. 샘플 회원들의 랭킹 참여 상태 업데이트
INSERT INTO ranking_participation (seller_id, is_participating, show_score, show_sales_performance)
SELECT
  id,
  true,
  true,
  true
FROM users
WHERE email ILIKE '%sample%' OR email ILIKE '%test%'
ON CONFLICT (seller_id)
DO UPDATE SET
  is_participating = true,
  show_score = true,
  show_sales_performance = true,
  updated_at = CURRENT_TIMESTAMP;

-- 3. 결과 확인
SELECT
  u.email,
  u.name,
  rp.is_participating,
  rp.show_score,
  rp.show_sales_performance
FROM users u
JOIN ranking_participation rp ON u.id = rp.seller_id
WHERE u.email ILIKE '%sample%' OR u.email ILIKE '%test%';
