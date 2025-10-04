-- 거래처 테이블에 수수료 방식 추가
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- 수수료 방식 필드 추가
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT '정액' CHECK (commission_type IN ('정액', '정율'));

-- 기존 commission_rate 컬럼 주석 업데이트
COMMENT ON COLUMN suppliers.commission_rate IS '정액: 원/kg, 정율: %';

-- 확인
SELECT id, name, commission_type, commission_rate
FROM suppliers
ORDER BY name
LIMIT 10;
