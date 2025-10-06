-- ============================================
-- option_products 테이블 컬럼명 수정
-- ============================================
-- additional_quantity → shipping_additional_quantity

ALTER TABLE option_products
RENAME COLUMN additional_quantity TO shipping_additional_quantity;

-- 완료
SELECT '✅ additional_quantity → shipping_additional_quantity 컬럼명 변경 완료!' as result;
