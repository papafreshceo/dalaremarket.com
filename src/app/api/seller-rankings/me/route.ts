import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 내 랭킹 조회 API
 *
 * GET /api/seller-rankings/me?period=monthly
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('period') || 'monthly';

    // 내 최신 랭킹 조회
    const { data: myRanking, error: rankingError } = await supabase
      .from('seller_rankings')
      .select('*')
      .eq('seller_id', user.id)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(1)
      .single();

    if (rankingError && rankingError.code !== 'PGRST116') {
      console.error('My ranking fetch error:', rankingError);
      return NextResponse.json(
        { success: false, error: rankingError.message },
        { status: 500 }
      );
    }

    if (!myRanking) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '아직 랭킹 데이터가 없습니다. 주문을 시작하면 랭킹이 집계됩니다.'
      });
    }

    // 내 배지 조회
    const currentMonth = myRanking.period_start.substring(0, 7) + '-01';
    const { data: badges } = await supabase
      .from('seller_badges')
      .select(`
        *,
        badge_definitions!seller_badges_badge_id_fkey (
          name,
          icon,
          description
        )
      `)
      .eq('seller_id', user.id)
      .eq('period_month', currentMonth);

    // 전체 랭킹 수 조회 (내 순위의 의미 파악용)
    const { count: totalSellers } = await supabase
      .from('seller_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('period_type', periodType)
      .eq('period_start', myRanking.period_start);

    return NextResponse.json({
      success: true,
      data: {
        ...myRanking,
        badges: badges || [],
        total_sellers: totalSellers || 0
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
