-- 기존 holidays 테이블이 있는 경우를 위한 업데이트 마이그레이션
-- holiday_type 컬럼 추가 및 is_national 데이터 마이그레이션

-- 1. holiday_type 컬럼 추가 (임시로 NULL 허용)
ALTER TABLE holidays
ADD COLUMN IF NOT EXISTS holiday_type TEXT;

-- 2. 기존 데이터 마이그레이션
UPDATE holidays
SET holiday_type = CASE
  WHEN is_national = true THEN 'national'
  ELSE 'temporary'
END
WHERE holiday_type IS NULL;

-- 3. holiday_type을 NOT NULL로 변경하고 기본값 설정
ALTER TABLE holidays
ALTER COLUMN holiday_type SET NOT NULL,
ALTER COLUMN holiday_type SET DEFAULT 'national';

-- 4. is_national 컬럼을 generated column으로 변경 (기존 데이터 호환성)
-- PostgreSQL에서는 기존 컬럼을 generated로 변경할 수 없으므로, 삭제 후 재생성
ALTER TABLE holidays
DROP COLUMN IF EXISTS is_national;

ALTER TABLE holidays
ADD COLUMN is_national BOOLEAN GENERATED ALWAYS AS (holiday_type = 'national') STORED;

-- 5. 인덱스 업데이트
DROP INDEX IF EXISTS idx_holidays_type;
CREATE INDEX IF NOT EXISTS idx_holidays_type ON holidays(holiday_type);

-- 6. 코멘트 업데이트
COMMENT ON COLUMN holidays.holiday_type IS 'national: 국공휴일, temporary: 임시공휴일, shipping_closed: 발송휴무일, task: 할일, product_info: 상품정보';
