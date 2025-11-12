-- organizations 테이블에 grade 컬럼 추가
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS grade VARCHAR(20) DEFAULT 'bronze';

-- grade 값은 'bronze', 'silver', 'gold' 중 하나
ALTER TABLE organizations
ADD CONSTRAINT check_grade CHECK (grade IN ('bronze', 'silver', 'gold'));

-- 기존 데이터에 기본값 설정
UPDATE organizations
SET grade = 'bronze'
WHERE grade IS NULL;
