import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { getUserPrimaryOrganization } from '@/lib/organization-utils';
import logger from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/cash/claim-login
 * 하루 1회 로그인 보상 지급 (50캐시) - 조직 단위
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Rate Limiting: 사용자당 1분에 5번까지 허용 (남용 방지)
    const rateLimitResult = rateLimit(`claim-login:${user.id}`, {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1분
    });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    // 사용자의 조직 정보 가져오기
    let organization = await getUserPrimaryOrganization(user.id);

    // 조직이 없으면 자동 생성
    if (!organization) {
      const { autoCreateOrganizationFromUser } = await import('@/lib/auto-create-organization');
      const result = await autoCreateOrganizationFromUser(user.id);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || '조직 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 다시 조직 정보 조회
      organization = await getUserPrimaryOrganization(user.id);

      if (!organization) {
        return NextResponse.json(
          { success: false, error: '조직 생성 후에도 조직을 찾을 수 없습니다.' },
          { status: 500 }
        );
      }
    }

    // 오늘 날짜 (KST) - UTC+9
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // 캐시 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('cash_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      logger.error('[POST /api/cash/claim-login] 설정 조회 오류:', settingsError);
      return NextResponse.json(
        { success: false, error: '캐시 설정을 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    const loginReward = settings.login_reward;

    // 일일 보상 기록을 먼저 시도 (Race Condition 방지)
    // INSERT 성공 = 첫 번째 요청, INSERT 실패 = 이미 받았음
    const { error: insertRewardError } = await supabase
      .from('organization_daily_rewards')
      .insert({
        organization_id: organization.id,
        reward_date: today,
        login_reward_claimed: true
      });

    // 중복 키 에러 = 이미 받았음 (23505는 PostgreSQL의 unique_violation 에러 코드)
    if (insertRewardError) {
      if (insertRewardError.code === '23505') {
        return NextResponse.json(
          { success: false, error: '오늘 로그인 보상을 이미 받았습니다.', alreadyClaimed: true },
          { status: 200 }
        );
      }

      // 다른 에러는 로그만 남기고 계속 진행 (기존 레코드가 있을 수 있음)
      logger.warn('[POST /api/cash/claim-login] 일일 보상 기록 삽입 경고:', insertRewardError);

      // 기존 기록 확인
      const { data: existingReward } = await supabase
        .from('organization_daily_rewards')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('reward_date', today)
        .single();

      if (existingReward?.login_reward_claimed) {
        return NextResponse.json(
          { success: false, error: '오늘 로그인 보상을 이미 받았습니다.', alreadyClaimed: true },
          { status: 200 }
        );
      }
    }

    // 조직 캐시 잔액 조회 (organization_id 기준)
    let { data: userCash } = await supabase
      .from('organization_cash')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    // 캐시 계정이 없으면 생성
    if (!userCash) {
      const { data: newCash, error: insertError } = await supabase
        .from('organization_cash')
        .insert({
          organization_id: organization.id,
          balance: 0
        })
        .select()
        .single();

      if (insertError) {
        // 중복 키 오류 - 다시 조회
        if (insertError.code === '23505') {
          const { data: existingCash } = await supabase
            .from('organization_cash')
            .select('*')
            .eq('organization_id', organization.id)
            .single();

          if (existingCash) {
            userCash = existingCash;
          } else {
            logger.error('[POST /api/cash/claim-login] 캐시 생성 오류:', insertError);
            return NextResponse.json(
              { success: false, error: '캐시 정보를 생성할 수 없습니다.' },
              { status: 500 }
            );
          }
        } else {
          logger.error('[POST /api/cash/claim-login] 캐시 생성 오류:', insertError);
          return NextResponse.json(
            { success: false, error: '캐시 정보를 생성할 수 없습니다.' },
            { status: 500 }
          );
        }
      } else {
        userCash = newCash;
      }
    }

    const newBalance = userCash.balance + loginReward;

    // 캐시 잔액 업데이트 (organization_id 기준)
    const { error: updateError } = await supabase
      .from('organization_cash')
      .update({ balance: newBalance })
      .eq('organization_id', organization.id);

    if (updateError) {
      logger.error('[POST /api/cash/claim-login] 잔액 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '캐시 지급에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 거래 이력 추가
    const { error: transactionError } = await supabase
      .from('organization_cash_transactions')
      .insert({
        organization_id: organization.id,
        transaction_by: user.id,
        type: 'login',
        amount: loginReward,
        balance_after: newBalance,
        description: '일일 로그인 보상',
        metadata: { date: today }
      });

    if (transactionError) {
      logger.error('[POST /api/cash/claim-login] 거래 이력 추가 오류:', transactionError);
    }

    // 일일 보상 기록은 이미 앞에서 INSERT 완료됨 (73-109번 라인)

    return NextResponse.json({
      success: true,
      message: `${loginReward}캐시가 지급되었습니다!`,
      amount: loginReward,
      newBalance
    });

  } catch (error: any) {
    logger.error('[POST /api/cash/claim-login] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
