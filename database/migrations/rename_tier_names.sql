-- 티어명 변경: diamond/platinum/gold/silver -> LEGEND/ELITE/ADVANCE/STANDARD/LIGHT

-- 1. seller_rankings 테이블 티어 업데이트
UPDATE seller_rankings SET tier = 'LEGEND' WHERE tier = 'diamond';
UPDATE seller_rankings SET tier = 'ELITE' WHERE tier = 'platinum';
UPDATE seller_rankings SET tier = 'ADVANCE' WHERE tier = 'gold';
UPDATE seller_rankings SET tier = 'STANDARD' WHERE tier = 'silver';
UPDATE seller_rankings SET tier = 'LIGHT' WHERE tier = 'bronze';

-- 2. tier_criteria 테이블 tier_name 업데이트 (있다면)
UPDATE tier_criteria SET tier_name = 'LEGEND' WHERE tier_name = 'diamond';
UPDATE tier_criteria SET tier_name = 'ELITE' WHERE tier_name = 'platinum';
UPDATE tier_criteria SET tier_name = 'ADVANCE' WHERE tier_name = 'gold';
UPDATE tier_criteria SET tier_name = 'STANDARD' WHERE tier_name = 'silver';
UPDATE tier_criteria SET tier_name = 'LIGHT' WHERE tier_name = 'bronze';
