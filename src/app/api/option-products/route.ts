import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/option-products
 * 옵션 상품 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const optionName = searchParams.get('option_name');

    // partners 테이블과 조인하여 벤더명 가져오기
    let query = supabase.from('option_products').select(`
      *,
      shipping_vendor:partners!shipping_vendor_id(name)
    `);

    // 옵션명으로 필터링
    if (optionName) {
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
