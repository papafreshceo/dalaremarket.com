-- =====================================================
-- sub_accounts 테이블에 송장 출력 정보 컬럼 추가
-- =====================================================
-- 작성일: 2025-11-13
-- 설명:
--   - 서브 계정에도 송장 출력용 업체명/전화번호 필드 추가
--   - 메인 계정의 store_name, store_phone과 동일한 용도
-- =====================================================

-- 1. store_name, store_phone 컬럼 추가
ALTER TABLE sub_accounts
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS store_phone VARCHAR(20);

-- 2. 코멘트 추가
COMMENT ON COLUMN sub_accounts.store_name IS '송장 출력용 업체명';
COMMENT ON COLUMN sub_accounts.store_phone IS '송장 출력용 전화번호';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ sub_accounts에 송장 출력 정보 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 컬럼:';
  RAISE NOTICE '- store_name: 송장 출력용 업체명';
  RAISE NOTICE '- store_phone: 송장 출력용 전화번호';
  RAISE NOTICE '=================================================';
END $$;
