-- item_master 테이블에 category_5 (품종) 컬럼 추가
-- 실행 날짜: 2025-10-08

-- category_5 컬럼 추가 (품종)
ALTER TABLE item_master
ADD COLUMN IF NOT EXISTS category_5 TEXT;

-- 기존 데이터의 category_4를 category_5로 복사 (기존 품종명을 품종 컬럼으로 이동)
UPDATE item_master
SET category_5 = category_4
WHERE category_5 IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN item_master.category_1 IS '대분류';
COMMENT ON COLUMN item_master.category_2 IS '중분류';
COMMENT ON COLUMN item_master.category_3 IS '소분류';
COMMENT ON COLUMN item_master.category_4 IS '품목';
COMMENT ON COLUMN item_master.category_5 IS '품종';
