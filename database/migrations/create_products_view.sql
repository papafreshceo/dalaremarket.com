-- products/all 페이지 성능 최적화를 위한 View 생성
-- option_products + products_master + cloudinary_images를 JOIN

-- 기존 View가 있으면 삭제
DROP VIEW IF EXISTS public.v_seller_products;

-- 셀러 공급 상품 통합 View 생성
CREATE VIEW public.v_seller_products AS
SELECT
  op.id,
  op.option_name,
  op.option_code,
  op.seller_supply_price,
  op.shipping_entity,
  op.invoice_entity,
  op.shipping_vendor_id,
  op.shipping_location_name,
  op.shipping_location_address,
  op.shipping_location_contact,
  op.shipping_cost,
  op.product_master_id,
  op.is_seller_supply,
  op.created_at,
  op.updated_at,

  -- products_master 정보
  pm.category_1,
  pm.category_2,
  pm.category_3,
  pm.category_4,
  pm.supply_status AS category_supply_status,
  pm.is_best,
  pm.is_recommended,
  pm.has_image,
  pm.has_detail_page,
  pm.shipping_deadline,
  pm.season_start_date,
  pm.season_end_date,

  -- 옵션상품 대표이미지 (우선순위 1)
  opt_img.secure_url AS option_thumbnail_url,

  -- 품목 대표이미지 (우선순위 2 - 옵션이미지 없을 때 사용)
  cat_img.secure_url AS category_thumbnail_url,

  -- 최종 썸네일 (우선순위: 옵션 > 품목)
  COALESCE(opt_img.secure_url, cat_img.secure_url) AS thumbnail_url

FROM
  public.option_products op

  -- products_master JOIN (품목 정보)
  LEFT JOIN public.products_master pm
    ON op.product_master_id = pm.id
    AND pm.is_active = true
    AND pm.seller_supply = true
    AND pm.category_4 IS NOT NULL

  -- 옵션상품 대표이미지 JOIN
  LEFT JOIN (
    SELECT DISTINCT ON (option_product_id)
      option_product_id,
      secure_url
    FROM public.cloudinary_images
    WHERE is_representative = true
      AND option_product_id IS NOT NULL
  ) opt_img ON op.id = opt_img.option_product_id

  -- 품목 대표이미지 JOIN
  LEFT JOIN (
    SELECT DISTINCT ON (category_4_id)
      category_4_id,
      secure_url
    FROM public.cloudinary_images
    WHERE is_representative = true
      AND category_4_id IS NOT NULL
  ) cat_img ON pm.id = cat_img.category_4_id

WHERE
  -- 품목의 셀러공급=true AND 옵션상품의 셀러공급=true
  pm.seller_supply = true
  AND COALESCE(op.is_seller_supply, true) = true

ORDER BY
  op.option_name;

-- View에 대한 설명
COMMENT ON VIEW public.v_seller_products IS '셀러 공급 상품 통합 뷰 - option_products + products_master + cloudinary_images JOIN';

-- 권한 설정 (인증된 사용자만 조회 가능)
GRANT SELECT ON public.v_seller_products TO authenticated;
GRANT SELECT ON public.v_seller_products TO anon;
