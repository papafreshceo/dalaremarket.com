-- ===========================
-- 강제 삭제 및 재생성: get_order_statistics 함수
-- ===========================

-- 1. 모든 get_order_statistics 함수 찾아서 삭제
DO $$
DECLARE
    func_signature text;
BEGIN
    -- 모든 get_order_statistics 함수 시그니처 찾기
    FOR func_signature IN
        SELECT pg_catalog.pg_get_function_identity_arguments(p.oid)
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'get_order_statistics'
          AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.get_order_statistics(%s) CASCADE', func_signature);
        RAISE NOTICE 'Dropped function: get_order_statistics(%)', func_signature;
    END LOOP;
END $$;

-- 2. 새 함수 생성
CREATE FUNCTION get_order_statistics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_date_type TEXT DEFAULT 'sheet',
  p_market_name TEXT DEFAULT NULL,
  p_shipping_status TEXT DEFAULT NULL,
  p_vendor_name TEXT DEFAULT NULL,
  p_search_keyword TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- 메인 통계 계산
  WITH filtered_orders AS (
    SELECT
      o.id,
      o.shipping_status,
      o.quantity,
      o.seller_supply_price,
      o.vendor_name,
      o.organization_id,
      COALESCE(org.name, u.name, u.email) as seller_name,
      o.option_name,
      o.payment_confirmed_at,
      o.refund_processed_at
    FROM integrated_orders o
    LEFT JOIN users u ON o.seller_id = u.id
    LEFT JOIN organizations org ON o.organization_id = org.id
    WHERE o.is_deleted = false
      AND (p_organization_id IS NULL OR o.organization_id = p_organization_id)
      AND (
        p_start_date IS NULL
        OR p_end_date IS NULL
        OR (
          CASE
            WHEN p_date_type = 'payment' THEN o.payment_date::date
            ELSE o.sheet_date::date
          END BETWEEN p_start_date AND p_end_date
        )
      )
      AND (p_market_name IS NULL OR o.market_name = p_market_name)
      AND (p_shipping_status IS NULL OR o.shipping_status = p_shipping_status)
      AND (p_vendor_name IS NULL OR o.vendor_name = p_vendor_name)
      AND (
        p_search_keyword IS NULL
        OR o.order_number ILIKE '%' || p_search_keyword || '%'
        OR o.recipient_name ILIKE '%' || p_search_keyword || '%'
        OR o.option_name ILIKE '%' || p_search_keyword || '%'
      )
  ),
  status_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE shipping_status = '접수') as 접수,
      COUNT(*) FILTER (WHERE shipping_status = '결제완료') as 결제완료,
      COUNT(*) FILTER (WHERE shipping_status = '상품준비중') as 상품준비중,
      COUNT(*) FILTER (WHERE shipping_status = '발송완료') as 발송완료,
      COUNT(*) FILTER (WHERE shipping_status = '취소요청') as 취소요청,
      COUNT(*) FILTER (WHERE shipping_status = '취소완료') as 취소완료,
      COUNT(*) FILTER (WHERE shipping_status = '환불완료') as 환불완료
    FROM filtered_orders
  ),
  vendor_stats AS (
    SELECT
      COALESCE(vendor_name, '미지정') as shipping_source,
      COUNT(*) FILTER (WHERE shipping_status = '접수') as "접수_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '접수') as "접수_수량",
      COUNT(*) FILTER (WHERE shipping_status = '결제완료') as "결제완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '결제완료') as "결제완료_수량",
      COUNT(*) FILTER (WHERE shipping_status = '상품준비중') as "상품준비중_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '상품준비중') as "상품준비중_수량",
      COUNT(*) FILTER (WHERE shipping_status = '발송완료') as "발송완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '발송완료') as "발송완료_수량",
      COUNT(*) FILTER (WHERE shipping_status = '취소요청') as "취소요청_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '취소요청') as "취소요청_수량",
      COUNT(*) FILTER (WHERE shipping_status = '취소완료') as "취소완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '취소완료') as "취소완료_수량"
    FROM filtered_orders
    GROUP BY vendor_name
    ORDER BY COUNT(*) DESC
  ),
  seller_stats AS (
    SELECT
      organization_id,
      COALESCE(seller_name, '미지정') as seller_name,
      SUM(COALESCE(seller_supply_price::numeric, 0)) FILTER (WHERE shipping_status = '접수') as "총금액",
      bool_or(payment_confirmed_at IS NOT NULL) as "입금확인",
      COUNT(*) FILTER (WHERE shipping_status = '접수') as "접수_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '접수') as "접수_수량",
      COUNT(*) FILTER (WHERE shipping_status = '결제완료') as "결제완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '결제완료') as "결제완료_수량",
      COUNT(*) FILTER (WHERE shipping_status = '상품준비중') as "상품준비중_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '상품준비중') as "상품준비중_수량",
      COUNT(*) FILTER (WHERE shipping_status = '발송완료') as "발송완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '발송완료') as "발송완료_수량",
      COUNT(*) FILTER (WHERE shipping_status = '취소요청') as "취소요청_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '취소요청') as "취소요청_수량",
      SUM(COALESCE(seller_supply_price::numeric, 0)) FILTER (WHERE shipping_status = '취소요청') as "환불예정액",
      MAX(refund_processed_at) as "환불처리일시",
      COUNT(*) FILTER (WHERE shipping_status = '취소완료') as "취소완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '취소완료') as "취소완료_수량"
    FROM filtered_orders
    GROUP BY organization_id, seller_name
    ORDER BY COUNT(*) DESC
  ),
  option_stats AS (
    SELECT
      COALESCE(option_name, '미지정') as option_name,
      COUNT(*) FILTER (WHERE shipping_status = '접수') as "접수_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '접수') as "접수_수량",
      COUNT(*) FILTER (WHERE shipping_status = '결제완료') as "결제완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '결제완료') as "결제완료_수량",
      COUNT(*) FILTER (WHERE shipping_status = '상품준비중') as "상품준비중_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '상품준비중') as "상품준비중_수량",
      COUNT(*) FILTER (WHERE shipping_status = '발송완료') as "발송완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '발송완료') as "발송완료_수량",
      COUNT(*) FILTER (WHERE shipping_status = '취소요청') as "취소요청_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '취소요청') as "취소요청_수량",
      COUNT(*) FILTER (WHERE shipping_status = '취소완료') as "취소완료_건수",
      SUM(COALESCE(quantity::integer, 0)) FILTER (WHERE shipping_status = '취소완료') as "취소완료_수량"
    FROM filtered_orders
    GROUP BY option_name
    ORDER BY option_name
  )
  SELECT json_build_object(
    'status_stats', (SELECT row_to_json(s) FROM status_stats s),
    'vendor_stats', (SELECT json_agg(v) FROM vendor_stats v),
    'seller_stats', (SELECT json_agg(s) FROM seller_stats s),
    'option_stats', (SELECT json_agg(o) FROM option_stats o)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_order_statistics IS
'통합 주문 통계 계산 함수 - 조직 필터링 지원
Returns: JSON object with status_stats, vendor_stats, seller_stats, option_stats';

-- 3. 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ get_order_statistics 함수가 성공적으로 재생성되었습니다.';
END $$;
