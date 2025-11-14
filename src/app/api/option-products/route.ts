import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/option-products
 * 옵션 상품 정보 조회 (비회원도 가능)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const optionName = searchParams.get('option_name');
    const optionNames = searchParams.get('option_names'); // 다중 조회용 (쉼표 구분)

    // Service role client 사용 (비회원도 조회 가능)
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // partners 테이블과 조인하여 벤더명 가져오기
    let query = supabase.from('option_products').select(`
      *,
      shipping_vendor:partners!shipping_vendor_id(name)
    `);

    // 다중 옵션상품 조회 (우선순위)
    if (optionNames) {
      const nameArray = optionNames.split(',').map(n => n.trim());
      query = query.in('option_name', nameArray);
    }
    // 단일 옵션상품 조회
    else if (optionName) {
      query = query.eq('option_name', optionName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('옵션 상품 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // shipping_vendor.name을 vendor_name으로 변환
    const processedData = (data || []).map(item => ({
      ...item,
      vendor_name: item.shipping_vendor?.name || null,
      shipping_vendor: undefined // 원본 조인 데이터 제거
    }));

    return NextResponse.json({ success: true, data: processedData });
  } catch (error: any) {
    console.error('GET /api/option-products 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
