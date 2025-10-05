-- raw_materials 단위 구조 개선
-- standard_unit을 단위와 수량으로 분리

-- 1. standard_quantity 컬럼 추가
ALTER TABLE raw_materials
ADD COLUMN IF NOT EXISTS standard_quantity DECIMAL(10,2);

-- 2. 기존 데이터에서 단위와 수량 분리
-- 예: "4kg" → standard_quantity: 4, standard_unit: "kg"

-- 2-1. 숫자 추출하여 standard_quantity에 저장
UPDATE raw_materials
SET standard_quantity = CAST(regexp_replace(standard_unit, '[^0-9.]', '', 'g') AS DECIMAL)
WHERE standard_unit ~ '[0-9]';

-- 2-2. 단위만 남기기 (kg, g, 개, 봉 등)
UPDATE raw_materials
SET standard_unit = regexp_replace(standard_unit, '[0-9.]', '', 'g')
WHERE standard_unit ~ '[0-9]';

-- 3. 기본값 설정
UPDATE raw_materials
SET standard_quantity = 1
WHERE standard_quantity IS NULL;

-- 4. 단위 표준화
UPDATE raw_materials
SET standard_unit = CASE
  WHEN standard_unit ILIKE '%kg%' THEN 'kg'
  WHEN standard_unit ILIKE '%g%' THEN 'g'
  WHEN standard_unit ILIKE '%개%' THEN '개'
  WHEN standard_unit ILIKE '%봉%' THEN '봉'
  WHEN standard_unit ILIKE '%box%' THEN '박스'
  WHEN standard_unit ILIKE '%팩%' THEN '팩'
  ELSE 'kg'
END
WHERE standard_unit IS NOT NULL;

-- 5. NOT NULL 제약조건 추가
ALTER TABLE raw_materials
ALTER COLUMN standard_quantity SET NOT NULL;

-- 6. 컬럼 설명 추가
COMMENT ON COLUMN raw_materials.standard_quantity IS '기준 수량 (예: 4)';
COMMENT ON COLUMN raw_materials.standard_unit IS '기준 단위 (kg, g, 개, 봉, 박스, 팩 등)';
