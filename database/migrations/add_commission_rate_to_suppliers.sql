-- 거래처 테이블에 수수료율 추가
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- 수수료율 필드 추가 (단위: 원/kg 또는 절대값)
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(10,2) DEFAULT 0;

-- 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'suppliers' AND column_name = 'commission_rate';
