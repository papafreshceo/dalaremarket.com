-- Migration: seller_order_number 칼럼 추가
-- 작성일: 2025-10-16
-- 목적: 셀러의 주문번호와 시스템 발주번호를 분리 저장

-- ==========================================
-- 1. seller_order_number 칼럼 추가
-- ==========================================

ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS seller_order_number VARCHAR(255);

COMMENT ON COLUMN integrated_orders.seller_order_number IS '셀러의 원본 주문번호';
COMMENT ON COLUMN integrated_orders.order_number IS '시스템 발주번호 (발주확정 시 생성)';

-- ==========================================
-- 2. 기존 데이터 마이그레이션 (선택사항)
-- ==========================================

-- 기존 order_number 값을 seller_order_number로 복사
-- (발주확정되지 않은 주문들의 경우)
-- UPDATE integrated_orders
-- SET seller_order_number = order_number
-- WHERE shipping_status IN ('발주서등록', '접수')
--   AND seller_order_number IS NULL;

-- ==========================================
-- 3. 인덱스 추가 (검색 성능 향상)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_integrated_orders_seller_order_number
ON integrated_orders(seller_order_number);

-- ==========================================
-- 4. 확인 쿼리
-- ==========================================

-- SELECT
--   id,
--   order_number as 발주번호,
--   seller_order_number as 셀러주문번호,
--   shipping_status,
--   seller_id
-- FROM integrated_orders
-- ORDER BY id DESC
-- LIMIT 10;
