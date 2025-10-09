-- =====================================================
-- integrated_orders 소프트 삭제 및 취소 플래그 추가
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: 실제 삭제 대신 플래그로 관리, 취소 이력도 기록
-- =====================================================

-- 삭제 관련 칼럼 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 취소 관련 칼럼 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS is_canceled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 인덱스 생성 (삭제되지 않은 주문만 빠르게 조회)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_not_deleted
ON integrated_orders(is_deleted)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_integrated_orders_not_canceled
ON integrated_orders(is_canceled)
WHERE is_canceled = FALSE;

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.is_deleted IS '삭제 여부 (소프트 삭제)';
COMMENT ON COLUMN integrated_orders.deleted_at IS '삭제 시간';
COMMENT ON COLUMN integrated_orders.deleted_by IS '삭제한 사용자';
COMMENT ON COLUMN integrated_orders.is_canceled IS '취소 여부';
COMMENT ON COLUMN integrated_orders.canceled_at IS '취소 시간';
COMMENT ON COLUMN integrated_orders.canceled_by IS '취소한 사용자';
COMMENT ON COLUMN integrated_orders.cancel_reason IS '취소 사유';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '소프트 삭제 및 취소 플래그 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '삭제: is_deleted, deleted_at, deleted_by';
  RAISE NOTICE '취소: is_canceled, canceled_at, canceled_by, cancel_reason';
  RAISE NOTICE '인덱스 생성 완료';
  RAISE NOTICE '=================================================';
END $$;
