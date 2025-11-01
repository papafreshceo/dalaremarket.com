import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cash/claim-activity
 * 활동 시간 보상 지급 (1분당 1캐시, 하루 최대 50캐시)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { minutes } = body; // 활동 시간 (분)

    if (typeof minutes !== 'number' || minutes <= 0) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 활동 시간입니다.' },
        { status: 400 }
      );
    }

    // 오늘 날짜 (KST)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // 캐시 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('cash_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error('[POST /api/cash/claim-activity] 설정 조회 오류:', settingsError);
      return NextResponse.json(
        { success: false, error: '캐시 설정을 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    const rewardPerMinute = settings.activity_reward_per_minute;
    const dailyLimit = settings.daily_activity_limit;

    // 오늘의 활동 보상 기록 조회
    let { data: dailyReward } = await supabase
      .from('user_daily_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('reward_date', today)
      .single();

    // 기록이 없으면 생성
    if (!dailyReward) {
      const { data: newDaily, error: insertError } = await supabase
        .from('user_daily_rewards')
        .insert({
          user_id: user.id,
          reward_date: today,
          login_reward_claimed: false,
          activity_minutes_rewarded: 0,
          activity_points_earned: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('[POST /api/cash/claim-activity] 일일 기록 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '활동 기록을 생성할 수 없습니다.' },
          { status: 500 }
        );
      }
      dailyReward = newDaily;
    }

    // 이미 오늘 최대 한도에 도달했는지 확인
    if (dailyReward.activity_points_earned >= dailyLimit) {
      return NextResponse.json(
        { success: false, error: '오늘 활동 보상 한도에 도달했습니다.', limitReached: true },
        { status: 400 }
      );
    }

    // 지급할 캐시 계산
    const potentialPoints = Math.floor(minutes) * rewardPerMinute;
    const availablePoints = dailyLimit - dailyReward.activity_points_earned;
    const pointsToGive = Math.min(potentialPoints, availablePoints);

    if (pointsToGive <= 0) {
      return NextResponse.json(
        { success: false, error: '지급할 캐시가 없습니다.' },
        { status: 400 }
      );
    }

    // 사용자 캐시 잔액 조회
    let { data: userCash } = await supabase
      .from('user_cash')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 캐시 계정이 없으면 생성
    if (!userCash) {
      const { data: newCash, error: insertError } = await supabase
        .from('user_cash')
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single();

      if (insertError) {
        console.error('[POST /api/cash/claim-activity] 캐시 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '캐시 정보를 생성할 수 없습니다.' },
          { status: 500 }
        );
      }
      userCash = newCash;
    }

    const newBalance = userCash.balance + pointsToGive;

    // 캐시 잔액 업데이트
    const { error: updateError } = await supabase
      .from('user_cash')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[POST /api/cash/claim-activity] 잔액 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '캐시 지급에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 거래 이력 추가
    const { error: transactionError } = await supabase
      .from('user_cash_transactions')
      .insert({
        user_id: user.id,
        type: 'activity',
        amount: pointsToGive,
        balance_after: newBalance,
        description: `활동 시간 보상 (${Math.floor(minutes)}분)`,
        metadata: { date: today, minutes: Math.floor(minutes) }
      });

    if (transactionError) {
      console.error('[POST /api/cash/claim-activity] 거래 이력 추가 오류:', transactionError);
    }

    // 일일 보상 기록 업데이트
    const newMinutesRewarded = dailyReward.activity_minutes_rewarded + Math.floor(minutes);
    const newPointsEarned = dailyReward.activity_points_earned + pointsToGive;

    await supabase
      .from('user_daily_rewards')
      .update({
        activity_minutes_rewarded: newMinutesRewarded,
        activity_points_earned: newPointsEarned
      })
      .eq('user_id', user.id)
      .eq('reward_date', today);

    return NextResponse.json({
      success: true,
      message: `${pointsToGive}캐시가 지급되었습니다!`,
      amount: pointsToGive,
      newBalance,
      dailyEarned: newPointsEarned,
      dailyLimit
    });

  } catch (error: any) {
    console.error('[POST /api/cash/claim-activity] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
