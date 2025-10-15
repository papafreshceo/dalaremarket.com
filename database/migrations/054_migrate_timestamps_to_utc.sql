-- Migration: 기존 한국 시간 타임스탬프를 UTC로 변환
-- 작성일: 2025-10-16
-- 목적: 모든 타임스탬프를 UTC 표준으로 통일하여 타임존 독립성 확보

-- ==========================================
-- 1. integrated_orders 테이블 타임스탬프 변환
-- ==========================================

-- 주의: 기존에 한국 시간(UTC+9)으로 저장된 값을 UTC로 변환 (9시간 빼기)

UPDATE integrated_orders
SET
  created_at = created_at - INTERVAL '9 hours',
  updated_at = updated_at - INTERVAL '9 hours',
  confirmed_at = CASE
    WHEN confirmed_at IS NOT NULL THEN confirmed_at - INTERVAL '9 hours'
    ELSE NULL
  END,
  payment_confirmed_at = CASE
    WHEN payment_confirmed_at IS NOT NULL THEN payment_confirmed_at - INTERVAL '9 hours'
    ELSE NULL
  END,
  cancel_requested_at = CASE
    WHEN cancel_requested_at IS NOT NULL THEN cancel_requested_at - INTERVAL '9 hours'
    ELSE NULL
  END,
  canceled_at = CASE
    WHEN canceled_at IS NOT NULL THEN canceled_at - INTERVAL '9 hours'
    ELSE NULL
  END,
  refund_processed_at = CASE
    WHEN refund_processed_at IS NOT NULL THEN refund_processed_at - INTERVAL '9 hours'
    ELSE NULL
  END
WHERE TRUE; -- 모든 레코드에 적용

-- ==========================================
-- 2. 다른 테이블의 타임스탬프 변환 (필요 시)
-- ==========================================

-- users 테이블
UPDATE users
SET
  created_at = created_at - INTERVAL '9 hours',
  updated_at = updated_at - INTERVAL '9 hours'
WHERE TRUE;

-- product_options 테이블
UPDATE product_options
SET
  created_at = created_at - INTERVAL '9 hours',
  updated_at = updated_at - INTERVAL '9 hours'
WHERE TRUE;

-- option_mapping 테이블
UPDATE option_mapping
SET
  created_at = created_at - INTERVAL '9 hours',
  updated_at = updated_at - INTERVAL '9 hours'
WHERE TRUE;

-- ==========================================
-- 3. updated_at 트리거 함수 수정 (UTC 저장)
-- ==========================================

-- 기존 트리거 함수를 UTC 저장 방식으로 변경
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'UTC'; -- UTC로 저장
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. 컬럼 기본값 수정 (UTC 저장)
-- ==========================================

-- integrated_orders 테이블
ALTER TABLE integrated_orders
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

-- users 테이블
ALTER TABLE users
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

-- product_options 테이블
ALTER TABLE product_options
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

-- option_mapping 테이블
ALTER TABLE option_mapping
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

-- ==========================================
-- 5. 변환 결과 확인 쿼리
-- ==========================================

-- 확인: 최근 주문 10건의 타임스탬프 확인
-- SELECT
--   id,
--   order_number,
--   created_at,
--   created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul' as created_at_korean,
--   shipping_status
-- FROM integrated_orders
-- ORDER BY id DESC
-- LIMIT 10;

-- 확인: 취소 관련 타임스탬프
-- SELECT
--   id,
--   order_number,
--   cancel_requested_at,
--   cancel_requested_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul' as cancel_requested_korean,
--   canceled_at,
--   canceled_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul' as canceled_korean
-- FROM integrated_orders
-- WHERE cancel_requested_at IS NOT NULL OR canceled_at IS NOT NULL
-- ORDER BY id DESC
-- LIMIT 10;
