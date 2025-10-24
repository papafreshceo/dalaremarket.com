-- 테스트용 시즌 날짜 추가 (몇 개 품목에만)

-- 딱딱이444: 8월 15일 ~ 10월 31일
UPDATE products_master
SET
  season_start_date = '08-15',
  season_end_date = '10-31'
WHERE category_4 = '딱딱이444';

-- 다른 품목들에도 시즌 추가 (있는 경우)
UPDATE products_master
SET
  season_start_date = '07-01',
  season_end_date = '09-30'
WHERE category_4 LIKE '%파프리카%';

UPDATE products_master
SET
  season_start_date = '05-01',
  season_end_date = '07-31'
WHERE category_4 LIKE '%토마토%';

UPDATE products_master
SET
  season_start_date = '12-01',
  season_end_date = '02-28'
WHERE category_4 LIKE '%딸기%';

-- 확인
SELECT category_4, season_start_date, season_end_date
FROM products_master
WHERE season_start_date IS NOT NULL AND season_end_date IS NOT NULL;
