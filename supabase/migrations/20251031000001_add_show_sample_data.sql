-- users 테이블에 show_sample_data 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_sample_data BOOLEAN DEFAULT true;

-- 컬럼 설명 추가
COMMENT ON COLUMN users.show_sample_data IS '샘플 데이터 표시 여부 (첫 주문 업로드 시 자동으로 false로 변경)';

-- 기존 사용자는 false로 설정 (이미 주문 데이터가 있을 수 있음)
UPDATE users SET show_sample_data = false WHERE show_sample_data IS NULL;
