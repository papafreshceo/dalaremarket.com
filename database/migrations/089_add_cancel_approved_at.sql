-- =====================================================
-- 취소승인일시 칼럼 추가
-- =====================================================
-- 작성일: 2025-11-20
-- 설명: 관리자가 취소요청을 승인한 일시를 기록하는 칼럼 추가
-- =====================================================

-- integrated_orders 테이블에 cancel_approved_at 칼럼 추가
ALTER TABLE integrated_orders
  ADD COLUMN IF NOT EXISTS cancel_approved_at TIMESTAMPTZ;

-- 칼럼에 주석 추가
COMMENT ON COLUMN integrated_orders.cancel_approved_at IS '취소승인일시 (관리자가 취소요청을 승인한 시각, UTC 기준)';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Migration 089 completed: cancel_approved_at column added to integrated_orders table';
END $$;
