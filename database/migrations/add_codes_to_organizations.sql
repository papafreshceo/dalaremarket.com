-- =====================================================
-- organizations 테이블에 셀러 코드 컬럼 추가
-- =====================================================
-- 작성일: 2025-01-13
-- 설명:
--   - 담당자가 소유자의 코드를 볼 수 있도록 organizations에 코드 저장
--   - 소유자의 users.seller_code를 복사
--   - 파트너 코드는 관리자가 수동으로 관리
-- =====================================================

-- 1. seller_code 컬럼 추가
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS seller_code VARCHAR(50);

-- 2. 코멘트 추가
COMMENT ON COLUMN organizations.seller_code IS '소유자의 셀러 코드 (users 테이블과 동기화)';

-- 3. 기존 데이터 마이그레이션 (소유자의 코드를 organization에 복사)
UPDATE organizations o
SET seller_code = u.seller_code
FROM users u
WHERE o.owner_id = u.id
  AND o.seller_code IS NULL;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations에 셀러 코드 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '추가된 컬럼:';
  RAISE NOTICE '- seller_code: 소유자의 셀러 코드';
  RAISE NOTICE '=================================================';
END $$;
