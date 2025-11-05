-- holidays 테이블에 task, product_info 타입 추가
-- 기존 테이블에 대한 코멘트 업데이트

-- 1. 코멘트 업데이트
COMMENT ON COLUMN holidays.holiday_type IS 'national: 국공휴일, temporary: 임시공휴일, shipping_closed: 발송휴무일, task: 할일, product_info: 상품정보';

-- 2. 테이블 코멘트 업데이트
COMMENT ON TABLE holidays IS '일정 관리 (공휴일, 휴무일, 할일, 상품정보 등)';
