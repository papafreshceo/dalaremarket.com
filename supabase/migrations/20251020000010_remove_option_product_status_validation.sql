-- 옵션상품은 별도의 상태값을 가지므로 검증 트리거 제거
-- 카테고리만 품목 마스터로부터 상속받음

DROP TRIGGER IF EXISTS trigger_validate_option_product_status ON option_products;
DROP FUNCTION IF EXISTS validate_option_product_status();
