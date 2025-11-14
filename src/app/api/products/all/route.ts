import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/products/all
 *
 * 셀러 공급 상품 목록 조회 (View 사용)
 * - v_seller_products View를 통해 JOIN된 데이터 한 번에 조회
 * - 3개 쿼리 → 1개 쿼리로 대폭 개선
 */
export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    // View에서 한 번에 조회
    const { data: products, error } = await supabase
      .from('v_seller_products')
      .select('*')
      .order('option_name', { ascending: true });

    if (error) {
      console.error('[products/all] 상품 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // supply_status_settings 조회 (상태 정보)
    const { data: supplyStatuses, error: statusError } = await supabase
      .from('supply_status_settings')
      .select('code, name, color, display_order')
      .eq('status_type', 'product')
      .eq('is_active', true)
      .order('display_order');

    if (statusError) {
      console.error('[products/all] 공급상태 조회 오류:', statusError);
    }

    return NextResponse.json({
      success: true,
      products: products || [],
      supplyStatuses: supplyStatuses || []
    });

  } catch (error: any) {
    console.error('[products/all] API 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
