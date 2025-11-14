import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    // 티어 기준 조회 (모든 사용자가 볼 수 있음)
    const { data: criteria, error: criteriaError } = await supabase
      .from('tier_criteria')
      .select('*')
      .order('min_total_sales', { ascending: false });

    if (criteriaError) {
      console.error('티어 기준 조회 오류:', criteriaError);
      return NextResponse.json({ error: '티어 기준을 불러올 수 없습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, criteria });
  } catch (error) {
    console.error('GET /api/admin/tier-criteria 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClientForRouteHandler();

    // 요청 데이터 파싱
    const { criteria } = await request.json();

    if (!Array.isArray(criteria)) {
      return NextResponse.json({ error: '유효하지 않은 데이터 형식입니다.' }, { status: 400 });
    }

    // 각 티어 기준 업데이트
    for (const item of criteria) {
      const {
        tier,
        min_order_count,
        min_total_sales,
        discount_rate,
        consecutive_months_for_bonus,
        bonus_tier_duration_months,
        description
      } = item;

      // 유효성 검사
      if (!tier || min_order_count < 0 || min_total_sales < 0 || discount_rate < 0) {
        return NextResponse.json({ error: '유효하지 않은 값이 포함되어 있습니다.' }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from('tier_criteria')
        .update({
          min_order_count,
          min_total_sales,
          discount_rate,
          consecutive_months_for_bonus,
          bonus_tier_duration_months,
          description
        })
        .eq('tier', tier);

      if (updateError) {
        console.error(`티어 ${tier} 업데이트 오류:`, updateError);
        return NextResponse.json({ error: `${tier} 등급 업데이트에 실패했습니다.` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: '티어 기준이 저장되었습니다.' });
  } catch (error) {
    console.error('PUT /api/admin/tier-criteria 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
