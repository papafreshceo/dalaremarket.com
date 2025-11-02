import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cash/claim-login
 * 하루 1회 로그인 보상 지급 (50캐시)
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
      console.error('[POST /api/cash/claim-login] 설정 조회 오류:', settingsError);
      return NextResponse.json(
        { success: false, error: '캐시 설정을 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    const loginReward = settings.login_reward;

    // 오늘 로그인 보상을 이미 받았는지 확인
    const { data: dailyReward, error: dailyRewardError } = await supabase
      .from('user_daily_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('reward_date', today)
      .single();

    // 이미 받았으면 200 OK로 조용히 반환 (에러가 아님)
    if (dailyReward && dailyReward.login_reward_claimed) {
      return NextResponse.json(
        { success: false, error: '오늘 로그인 보상을 이미 받았습니다.', alreadyClaimed: true },
        { status: 200 }
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
        console.error('[POST /api/cash/claim-login] 캐시 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '캐시 정보를 생성할 수 없습니다.' },
          { status: 500 }
        );
      }
      userCash = newCash;
    }

    const newBalance = userCash.balance + loginReward;

    // 캐시 잔액 업데이트
    const { error: updateError } = await supabase
      .from('user_cash')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[POST /api/cash/claim-login] 잔액 업데이트 오류:', updateError);
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
        type: 'login',
        amount: loginReward,
        balance_after: newBalance,
        description: '일일 로그인 보상',
        metadata: { date: today }
      });

    if (transactionError) {
      console.error('[POST /api/cash/claim-login] 거래 이력 추가 오류:', transactionError);
    }

    // 일일 보상 기록 업데이트
    if (dailyReward) {
      await supabase
        .from('user_daily_rewards')
        .update({ login_reward_claimed: true })
        .eq('user_id', user.id)
        .eq('reward_date', today);
    } else {
      await supabase
        .from('user_daily_rewards')
        .insert({
          user_id: user.id,
          reward_date: today,
          login_reward_claimed: true
        });
    }

    return NextResponse.json({
      success: true,
      message: `${loginReward}캐시가 지급되었습니다!`,
      amount: loginReward,
      newBalance
    });

  } catch (error: any) {
    console.error('[POST /api/cash/claim-login] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
