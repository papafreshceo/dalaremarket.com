-- =====================================================
-- organizations 테이블 은행 관련 필드 정리
-- =====================================================
-- 작성일: 2025-01-14
-- 설명: bank_name, account_holder 컬럼 추가 및 depositor_name 삭제
-- =====================================================

-- bank_name 컬럼 추가 (은행명)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS bank_name text NULL;

-- account_holder 컬럼 추가 (예금주)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS account_holder text NULL;

-- depositor_name 컬럼 삭제 (중복 제거, account_holder로 통일)
ALTER TABLE organizations
DROP COLUMN IF EXISTS depositor_name;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations 테이블 은행 필드 정리 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 컬럼:';
  RAISE NOTICE '1. bank_name (은행명)';
  RAISE NOTICE '2. account_holder (예금주)';
  RAISE NOTICE '';
  RAISE NOTICE '삭제된 컬럼:';
  RAISE NOTICE '1. depositor_name (account_holder로 통일)';
  RAISE NOTICE '=================================================';
END $$;
