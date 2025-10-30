-- raw_materials 테이블에서 shipping_deadline 칼럼 삭제
-- 원물 관리에서 사용하지 않음

ALTER TABLE raw_materials
DROP COLUMN IF EXISTS shipping_deadline;

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'raw_materials'
ORDER BY ordinal_position;
