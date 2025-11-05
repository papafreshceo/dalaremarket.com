import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 셀러 랭킹 조회 API
 *
 * GET /api/seller-rankings?period=monthly&limit=10
 *
 * 랭킹 참여 시스템:
 * - 본인이 참여 설정을 해야 랭킹을 볼 수 있음
 * - 각 사용자의 공개 설정에 따라 항목이 마스킹됨
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const periodType = searchParams.get('period') || 'monthly';
    const limit = parseInt(searchParams.get('limit') || '50');
    const sellerId = searchParams.get('seller_id'); // 특정 셀러 조회

    // 🔒 1. 현재 로그인한 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다.',
        requiresAuth: true
      }, { status: 401 });
    }

    // 🔒 2. 본인의 참여 설정 확인
    const { data: myParticipation } = await supabase
      .from('ranking_participation')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 참여하지 않으면 빈 배열 반환
    if (!myParticipation || !myParticipation.is_participating) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '랭킹을 보려면 먼저 참여 설정을 해주세요.',
        notParticipating: true
      });
    }

    // 🔒 3. 참여 중인 사용자들의 ID 조회
    const { data: participants } = await supabase
      .from('ranking_participation')
      .select('user_id')
      .eq('is_participating', true);

    if (!participants || participants.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '아직 참여한 다른 사용자가 없습니다.'
      });
    }

    const participantIds = participants.map(p => p.user_id);

    // 4. 참여자들의 랭킹만 조회
    let query = supabase
      .from('seller_rankings')
      .select(`
        *,
        users!seller_rankings_seller_id_fkey (
          id,
          name,
          profile_name,
          email,
          business_name
        )
      `)
      .eq('period_type', periodType)
      .in('seller_id', participantIds)
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

    // 참여자는 모든 정보 공개 (마스킹 없음)

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
