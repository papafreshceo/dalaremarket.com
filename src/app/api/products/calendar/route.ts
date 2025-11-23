import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/products/calendar
 *
 * 캘린더용 품목 데이터 조회
 * - products_master + supply_status_settings
 * - RLS 우회를 위해 Admin Client 사용
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // products_master에서 품목 정보 가져오기
    const { data: productsData, error: productsError } = await supabase
      .from('products_master')
      .select('id, category_1, category_2, category_3, category_4, supply_status, season_start_date, season_end_date, thumbnail_url')
      .order('category_3')
      .order('category_4');

    if (productsError) {
      console.error('[products/calendar] 품목 조회 오류:', productsError);
      return NextResponse.json(
        { success: false, error: productsError.message },
        { status: 500 }
      );
    }

    // 공급상태 설정 가져오기
    const { data: statusData, error: statusError } = await supabase
      .from('supply_status_settings')
      .select('code, name, color, display_order')
      .order('display_order');

    if (statusError) {
      console.error('[products/calendar] 상태 조회 오류:', statusError);
    }

    return NextResponse.json({
      success: true,
      products: productsData || [],
      supplyStatuses: statusData || []
    });

  } catch (error: any) {
    console.error('[products/calendar] API 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
