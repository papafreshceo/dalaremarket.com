-- =====================================================
-- CS Records 테이블에 재발송/환불 필드 추가
-- =====================================================
-- 작성일: 2025-10-14
-- 설명: 부분환불 및 재발송 처리를 위한 추가 필드
-- =====================================================

-- 1. 환불 관련 필드
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12,2);
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS account_holder VARCHAR(100);
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);

-- 2. 재발송 관련 필드
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS resend_tracking_number VARCHAR(100);
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS resend_option VARCHAR(200);
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS resend_quantity INTEGER;
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS resend_receiver VARCHAR(100);
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS resend_phone VARCHAR(20);
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS resend_address TEXT;
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS resend_note TEXT;
ALTER TABLE cs_records ADD COLUMN IF NOT EXISTS additional_amount DECIMAL(12,2);

-- 3. 코멘트 추가
COMMENT ON COLUMN cs_records.refund_amount IS '부분환불 금액';
COMMENT ON COLUMN cs_records.bank_name IS '환불 은행명';
COMMENT ON COLUMN cs_records.account_holder IS '환불 계좌 예금주';
COMMENT ON COLUMN cs_records.account_number IS '환불 계좌번호';
COMMENT ON COLUMN cs_records.resend_tracking_number IS '재발송 송장번호';
COMMENT ON COLUMN cs_records.resend_option IS '재발송 상품명';
COMMENT ON COLUMN cs_records.resend_quantity IS '재발송 수량';
COMMENT ON COLUMN cs_records.resend_receiver IS '재발송 수령인';
COMMENT ON COLUMN cs_records.resend_phone IS '재발송 전화번호';
COMMENT ON COLUMN cs_records.resend_address IS '재발송 주소';
COMMENT ON COLUMN cs_records.resend_note IS '재발송 메모';
COMMENT ON COLUMN cs_records.additional_amount IS '추가 결제 금액';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'CS Records 테이블 확장 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 필드:';
  RAISE NOTICE '  [환불 관련]';
  RAISE NOTICE '    - refund_amount (환불금액)';
  RAISE NOTICE '    - bank_name (은행명)';
  RAISE NOTICE '    - account_holder (예금주)';
  RAISE NOTICE '    - account_number (계좌번호)';
  RAISE NOTICE '  [재발송 관련]';
  RAISE NOTICE '    - resend_tracking_number (재발송송장번호)';
  RAISE NOTICE '    - resend_option (재발송상품)';
  RAISE NOTICE '    - resend_quantity (재발송수량)';
  RAISE NOTICE '    - resend_receiver (재발송수령인)';
  RAISE NOTICE '    - resend_phone (재발송전화번호)';
  RAISE NOTICE '    - resend_address (재발송주소)';
  RAISE NOTICE '    - resend_note (재발송메모)';
  RAISE NOTICE '    - additional_amount (추가결제금액)';
  RAISE NOTICE '=================================================';
END $$;
