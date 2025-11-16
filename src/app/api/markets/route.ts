import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * GET /api/markets
 * integrated_orders 테이블에서 마켓 목록 조회 (중복 제거)
 */
export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    // integrated_orders에서 unique한 market_name 가져오기
    const { data, error } = await supabase
      .from('integrated_orders')
      .select('market_name')
      .not('market_name', 'is', null)
      .neq('market_name', '');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 중복 제거 및 정렬
    const uniqueMarkets = Array.from(
      new Set(data.map((item) => item.market_name).filter(Boolean))
    ).sort();

    return NextResponse.json({
      success: true,
      data: uniqueMarkets,
    });
  } catch (error: any) {
    logger.error('GET /api/markets 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
