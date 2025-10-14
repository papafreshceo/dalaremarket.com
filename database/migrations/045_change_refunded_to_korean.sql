-- integrated_orders 테이블의 shipping_status 값을 'refunded'에서 '환불완료'로 변경
UPDATE integrated_orders
SET shipping_status = '환불완료'
WHERE shipping_status = 'refunded';

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.shipping_status IS '발송 상태 (접수, 결제완료, 상품준비중, 발송완료, 취소요청, 취소완료, 환불완료)';
