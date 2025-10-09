-- ===========================
-- 옵션상품 상태값 한글로 변경
-- ===========================
-- supply_status_settings 테이블의 code를 name(한글)으로 매핑하여 업데이트

-- option_products의 status를 supply_status_settings의 name(한글)으로 변경
UPDATE option_products op
SET status = ss.name
FROM supply_status_settings ss
WHERE ss.status_type = 'optional_product'
  AND ss.is_active = true
  AND (op.status = ss.code OR op.status = ss.name);

-- NULL이거나 매칭되지 않는 상태는 기본값으로 설정 (첫 번째 활성 상태)
UPDATE option_products
SET status = (
  SELECT name
  FROM supply_status_settings
  WHERE status_type = 'optional_product'
    AND is_active = true
  ORDER BY display_order
  LIMIT 1
)
WHERE status IS NULL
   OR status = ''
   OR status NOT IN (
     SELECT name
     FROM supply_status_settings
     WHERE status_type = 'optional_product'
       AND is_active = true
   );

COMMENT ON COLUMN option_products.status IS '상태 (supply_status_settings 테이블의 name 값 사용, 한글)';
