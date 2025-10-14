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

    let query = supabase.from('option_products').select('*');

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

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('GET /api/option-products 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
