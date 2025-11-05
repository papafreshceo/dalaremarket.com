-- 공휴일 관리 테이블
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL UNIQUE,
  holiday_name TEXT NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'national', -- 'national': 국공휴일, 'temporary': 임시공휴일, 'shipping_closed': 발송휴무일, 'task': 할일, 'product_info': 상품정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 기존 컬럼 호환성 유지 (deprecated)
  is_national BOOLEAN GENERATED ALWAYS AS (holiday_type = 'national') STORED
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_type ON holidays(holiday_type);

-- 코멘트
COMMENT ON TABLE holidays IS '일정 관리 (공휴일, 휴무일, 할일, 상품정보 등)';
COMMENT ON COLUMN holidays.holiday_date IS '날짜';
COMMENT ON COLUMN holidays.holiday_name IS '공휴일/휴무일 이름';
COMMENT ON COLUMN holidays.holiday_type IS 'national: 국공휴일, temporary: 임시공휴일, shipping_closed: 발송휴무일, task: 할일, product_info: 상품정보';
COMMENT ON COLUMN holidays.created_by IS '등록자';

-- 초기 데이터는 설정 페이지에서 "국공휴일 불러오기" 버튼으로 등록합니다
