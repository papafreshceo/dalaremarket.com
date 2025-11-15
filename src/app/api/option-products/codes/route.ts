import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';

/**
 * POST /api/option-products/codes
 * 옵션명 목록으로 옵션코드 조회
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 접근 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { option_names } = body;

    if (!option_names || !Array.isArray(option_names)) {
      return NextResponse.json(
        { success: false, error: '옵션명 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // option_products에서 option_code 조회
    const { data, error } = await supabase
      .from('option_products')
      .select('option_name, option_code')
      .in('option_name', option_names);

    if (error) {
      console.error('옵션코드 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('POST /api/option-products/codes 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
