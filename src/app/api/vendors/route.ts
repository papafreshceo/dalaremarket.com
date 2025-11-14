import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/vendors
 * integrated_orders 테이블에서 벤더사 목록 조회 (중복 제거)
 */
export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    // integrated_orders에서 unique한 vendor_name 가져오기
    const { data, error } = await supabase
      .from('integrated_orders')
      .select('vendor_name')
      .not('vendor_name', 'is', null)
      .neq('vendor_name', '');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 중복 제거 및 정렬
    const uniqueVendors = Array.from(
      new Set(data.map((item) => item.vendor_name).filter(Boolean))
    ).sort();

    return NextResponse.json({
      success: true,
      data: uniqueVendors,
    });
  } catch (error: any) {
    console.error('GET /api/vendors 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
