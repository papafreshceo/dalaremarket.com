import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/partners
 * 거래처 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const searchParams = request.nextUrl.searchParams;

    const partnerType = searchParams.get('partner_type'); // 벤더사, 셀러 등

    // 기본 쿼리
    let query = supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    // 거래처 유형 필터
    if (partnerType) {
      query = query.eq('partner_type', partnerType);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('거래처 조회 실패:', error);
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
    logger.error('거래처 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
