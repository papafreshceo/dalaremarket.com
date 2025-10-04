-- 원물 관리 테이블에 누락된 컬럼 추가
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- 최근 시세 필드 추가
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS latest_price DECIMAL(10,2);

-- 완료 확인
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'raw_materials'
  AND column_name = 'latest_price';
