-- ===========================
-- 보안 수정: get_order_statistics RPC 함수에 권한 체크 추가
-- ===========================

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS get_order_statistics(DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

-- 2. 보안이 강화된 새 함수 생성
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
  v_user_id UUID;
  v_user_role TEXT;
  v_user_org_id UUID;
BEGIN
  -- 🔒 보안: 현재 사용자 확인
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '인증이 필요합니다';
  END IF;

  -- 🔒 보안: 사용자 role 및 organization 확인
  SELECT role, primary_organization_id
  INTO v_user_role, v_user_org_id
  FROM users
  WHERE id = v_user_id;

  -- 🔒 보안: 권한 검증
  -- 관리자가 아닌 경우, 자신의 조직 데이터만 조회 가능
  IF v_user_role NOT IN ('super_admin', 'admin', 'employee') THEN
    -- 일반 셀러는 반드시 organization_id 필터가 있어야 함
    IF p_organization_id IS NULL THEN
      p_organization_id := v_user_org_id;
    END IF;

    -- 다른 조직의 데이터를 요청하면 에러
    IF p_organization_id IS DISTINCT FROM v_user_org_id THEN
      RAISE EXCEPTION '권한이 없습니다. 자신의 조직 데이터만 조회할 수 있습니다.';
    END IF;
  END IF;

  -- 메인 통계 계산
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_order_statistics IS
'통합 주문 통계 계산 함수 - 조직 필터링 및 권한 체크 포함
🔒 보안: 함수 내부에서 사용자 권한을 검증합니다.
- super_admin/admin/employee: 모든 조직 데이터 조회 가능
- 일반 셀러: 자신의 조직 데이터만 조회 가능';

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ get_order_statistics 함수가 보안 강화되어 재생성되었습니다.';
  RAISE NOTICE '   - 사용자 인증 체크 추가';
  RAISE NOTICE '   - 조직 기반 권한 체크 추가';
  RAISE NOTICE '   - 일반 셀러는 자신의 조직 데이터만 조회 가능';
END $$;
