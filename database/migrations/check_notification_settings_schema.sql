-- notification_settings 테이블 스키마 확인 및 new_message 컬럼 추가

-- =====================================================
-- 1. notification_settings 테이블 컬럼 확인
-- =====================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification_settings'
ORDER BY ordinal_position;

-- =====================================================
-- 2. new_message 관련 컬럼 추가 (없으면)
-- =====================================================

-- new_message_enabled 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_settings'
    AND column_name = 'new_message_enabled'
  ) THEN
    ALTER TABLE notification_settings
    ADD COLUMN new_message_enabled BOOLEAN DEFAULT true;

    RAISE NOTICE 'new_message_enabled 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'new_message_enabled 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- =====================================================
-- 3. 최종 확인
-- =====================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification_settings'
AND column_name LIKE '%message%'
ORDER BY ordinal_position;
