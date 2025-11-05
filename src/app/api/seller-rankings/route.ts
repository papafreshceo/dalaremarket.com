import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 셀러 랭킹 조회 API
 *
 * GET /api/seller-rankings?period=monthly&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const periodType = searchParams.get('period') || 'monthly';
    const limit = parseInt(searchParams.get('limit') || '50');
    const sellerId = searchParams.get('seller_id'); // 특정 셀러 조회

    // 최신 기간의 랭킹 조회
    let query = supabase
      .from('seller_rankings')
      .select(`
        *,
        users!seller_rankings_seller_id_fkey (
          id,
          name,
          email,
          business_name
        )
      `)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .order('rank', { ascending: true });

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data: allRankings, error } = await query;

    if (error) {
      console.error('Rankings fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!allRankings || allRankings.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '랭킹 데이터가 없습니다. 배치 작업을 실행해주세요.'
      });
    }

    // 최신 기간만 필터링
    const latestPeriod = allRankings[0].period_start;
    const rankings = allRankings
      .filter(r => r.period_start === latestPeriod)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: rankings,
      period: {
        type: periodType,
        start: latestPeriod,
        end: allRankings[0].period_end
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
