import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 누적점수 설정 조회
    const { data: settings, error } = await supabase
      .from('tier_point_settings')
      .select('*')
      .eq('setting_key', 'default')
      .single();

    if (error) {
      console.error('누적점수 설정 조회 오류:', error);
      return NextResponse.json({ error: '누적점수 설정을 불러올 수 없습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('GET /api/admin/tier-point-settings 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    // 요청 데이터 파싱
    const {
      loginPointsPerDay,
      pointsPerDay,
      postPoints,
      commentPoints,
      milestones,
      consecutiveBonuses,
      monthlyBonuses,
      noLoginPenalties,
      accumulatedPointCriteria
    } = await request.json();

    // 유효성 검사
    if (
      typeof loginPointsPerDay !== 'number' ||
      typeof pointsPerDay !== 'number' ||
      typeof postPoints !== 'number' ||
      typeof commentPoints !== 'number' ||
      !Array.isArray(milestones) ||
      !Array.isArray(consecutiveBonuses) ||
      !Array.isArray(monthlyBonuses) ||
      !Array.isArray(noLoginPenalties) ||
      !Array.isArray(accumulatedPointCriteria)
    ) {
      return NextResponse.json({ error: '유효하지 않은 데이터 형식입니다.' }, { status: 400 });
    }

    // 누적점수 설정 업데이트
    const { error: updateError } = await supabase
      .from('tier_point_settings')
      .update({
        login_points_per_day: loginPointsPerDay,
        points_per_day: pointsPerDay,
        post_points: postPoints,
        comment_points: commentPoints,
        milestones,
        consecutive_bonuses: consecutiveBonuses,
        monthly_bonuses: monthlyBonuses,
        no_login_penalties: noLoginPenalties,
        accumulated_point_criteria: accumulatedPointCriteria
      })
      .eq('setting_key', 'default');

    if (updateError) {
      console.error('누적점수 설정 업데이트 오류:', updateError);
      return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '누적점수 설정이 저장되었습니다.' });
  } catch (error) {
    console.error('PUT /api/admin/tier-point-settings 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
