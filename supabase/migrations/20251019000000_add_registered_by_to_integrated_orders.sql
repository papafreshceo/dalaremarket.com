-- =====================================================
-- Add registered_by column to integrated_orders
-- =====================================================
-- 작성일: 2025-10-19
-- 설명: 주문 접수자 정보를 저장하는 컬럼 추가
-- =====================================================

-- registered_by 컬럼 추가 (접수자)
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS registered_by VARCHAR(100);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN integrated_orders.registered_by IS '주문 접수자 (관리자 이름)';

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'registered_by 컬럼 추가 완료';
  RAISE NOTICE '=================================================';
END $$;
