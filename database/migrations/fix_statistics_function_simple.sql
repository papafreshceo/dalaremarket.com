-- ===========================
-- Fix: get_order_statistics 함수 간소화
-- ===========================
-- seller_name을 제거하고 organization_id만 사용

-- 1. 기존 함수 모두 삭제
DROP FUNCTION IF EXISTS get_order_statistics(DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_order_statistics(DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

-- 2. 새 함수 생성 (seller_name 제거, organization_id만 사용)
CREATE OR REPLACE FUNCTION get_order_statistics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_date_type TEXT DEFAULT 'sheet', -- 'sheet' or 'payment'
  p_market_name TEXT DEFAULT NULL,
  p_shipping_status TEXT DEFAULT NULL,
  p_vendor_name TEXT DEFAULT NULL,
  p_search_keyword TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL -- 조직 필터 추가
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_date_column TEXT;
BEGIN
  -- 날짜 컬럼 선택
  v_date_column := CASE WHEN p_date_type = 'payment' THEN 'payment_date' ELSE 'sheet_date' END;

  -- 메인 통계 계산 (단일 쿼리로 모든 통계 집계)
  WITH filtered_orders AS (
    SELECT
      o.id,
      o.shipping_status,
      o.quantity,
      o.seller_supply_price,
      o.vendor_name,
      o.organization_id,
      o.option_name,
      o.payment_confirmed_at,
      o.refund_processed_at
    FROM integrated_orders o
    WHERE o.is_deleted = false
      -- 조직 필터 (NULL이면 전체 조회)
      AND (p_organization_id IS NULL OR o.organization_id = p_organization_id)
      -- 날짜 필터
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
      -- 마켓명 필터
      AND (p_market_name IS NULL OR o.market_name = p_market_name)
      -- 발송상태 필터
      AND (p_shipping_status IS NULL OR o.shipping_status = p_shipping_status)
      -- 벤더사 필터
      AND (p_vendor_name IS NULL OR o.vendor_name = p_vendor_name)
      -- 검색어 필터 (주문번호, 수취인명, 옵션명)
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
    GROUP BY organization_id
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
'통합 주문 통계 계산 함수 - 조직 필터링 지원 (seller_name 제거)
Parameters:
  - p_start_date: 시작일
  - p_end_date: 종료일
  - p_date_type: 날짜 기준 (sheet or payment)
  - p_market_name: 마켓명
  - p_shipping_status: 발송상태
  - p_vendor_name: 벤더사
  - p_search_keyword: 검색어 (주문번호/수취인명/옵션명)
  - p_organization_id: 조직 ID (NULL이면 전체 조회)

Returns: JSON object with status_stats, vendor_stats, seller_stats (organization_id only), option_stats';
