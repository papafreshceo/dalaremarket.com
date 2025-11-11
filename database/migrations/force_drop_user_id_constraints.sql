-- =====================================================
-- ⚠️ 이 SQL을 Supabase SQL Editor에서 실행하세요
-- =====================================================
-- user_cash와 user_credits의 user_id UNIQUE 제약 조건 강제 제거
-- =====================================================

-- 1. 기존 제약 조건 강제 제거 (존재 여부 확인 없이)
ALTER TABLE user_cash DROP CONSTRAINT IF EXISTS user_cash_user_id_key;
ALTER TABLE user_credits DROP CONSTRAINT IF EXISTS user_credits_user_id_key;

-- 2. organization_id 기반 UNIQUE 제약 조건 추가
ALTER TABLE user_cash DROP CONSTRAINT IF EXISTS user_cash_organization_id_key;
ALTER TABLE user_cash ADD CONSTRAINT user_cash_organization_id_key UNIQUE (organization_id);

ALTER TABLE user_credits DROP CONSTRAINT IF EXISTS user_credits_organization_id_key;
ALTER TABLE user_credits ADD CONSTRAINT user_credits_organization_id_key UNIQUE (organization_id);

-- 3. 현재 제약 조건 확인
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid IN ('user_cash'::regclass, 'user_credits'::regclass)
  AND contype = 'u'
ORDER BY conrelid::regclass::text, conname;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 제약 조건 변경 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경 사항:';
  RAISE NOTICE '1. user_cash_user_id_key 제약 조건 제거';
  RAISE NOTICE '2. user_credits_user_id_key 제약 조건 제거';
  RAISE NOTICE '3. user_cash_organization_id_key 제약 조건 추가';
  RAISE NOTICE '4. user_credits_organization_id_key 제약 조건 추가';
  RAISE NOTICE '=================================================';
END $$;
