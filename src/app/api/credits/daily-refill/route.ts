import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/credits/daily-refill
 * 일일 크레딧 리필 (최대 1000, 저축 불가)
 * 날짜가 바뀌면 무조건 1000으로 리셋
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // impersonate 헤더 확인
    const impersonateUserId = request.headers.get('X-Impersonate-User-Id');

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 실제 사용할 사용자 ID 결정 (impersonate 우선)
    const effectiveUserId = impersonateUserId || user?.id;

    if (!effectiveUserId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // impersonate 모드인 경우 Service Role 사용 (RLS 우회)
    let dbClient = supabase;

    if (impersonateUserId) {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      dbClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }

    // 오늘 날짜 (KST)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const DAILY_CREDIT_LIMIT = 1000;

    // 크레딧 계정 조회
    let { data: userCredit, error: creditError } = await dbClient
      .from('user_credits')
      .select('*')
      .eq('user_id', effectiveUserId)
      .single();

    // impersonate 모드에서는 읽기 전용 (지급/리필하지 않음)
    if (impersonateUserId) {
      if (creditError || !userCredit) {
        return NextResponse.json({
          success: true,
          balance: 0,
          refilled: false,
          message: '조회 전용 모드',
          isImpersonate: true
        });
      }

      return NextResponse.json({
        success: true,
        balance: userCredit.balance,
        refilled: false,
        message: '조회 전용 모드',
        isImpersonate: true
      });
    }

    // 크레딧 계정이 없으면 생성 (일반 모드에만)
    if (creditError || !userCredit) {
      const { data: newCredit, error: insertError } = await dbClient
        .from('user_credits')
        .insert({
          user_id: effectiveUserId,
          balance: DAILY_CREDIT_LIMIT,
          last_refill_date: today
        })
        .select()
        .single();

      if (insertError) {
        console.error('[POST /api/credits/daily-refill] 크레딧 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '크레딧 정보를 생성할 수 없습니다.' },
          { status: 500 }
        );
      }

      // 거래 이력 추가
      await dbClient
        .from('user_credit_transactions')
        .insert({
          user_id: effectiveUserId,
          type: 'daily_refill',
          amount: DAILY_CREDIT_LIMIT,
          balance_after: DAILY_CREDIT_LIMIT,
          description: '일일 크레딧 지급',
          metadata: { date: today }
        });

      return NextResponse.json({
        success: true,
        balance: DAILY_CREDIT_LIMIT,
        refilled: true,
        message: '일일 크레딧이 지급되었습니다.'
      });
    }

    // 마지막 리필 날짜와 오늘 날짜 비교
    const lastRefillDate = userCredit.last_refill_date;

    if (lastRefillDate !== today) {
      // 날짜가 바뀌었으면 100으로 리필
      const { error: updateError } = await dbClient
        .from('user_credits')
        .update({
          balance: DAILY_CREDIT_LIMIT,
          last_refill_date: today
        })
        .eq('user_id', effectiveUserId);

      if (updateError) {
        console.error('[POST /api/credits/daily-refill] 크레딧 리필 오류:', updateError);
        return NextResponse.json(
          { success: false, error: '크레딧 리필에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 거래 이력 추가
      await dbClient
        .from('user_credit_transactions')
        .insert({
          user_id: effectiveUserId,
          type: 'daily_refill',
          amount: DAILY_CREDIT_LIMIT - userCredit.balance,
          balance_after: DAILY_CREDIT_LIMIT,
          description: '일일 크레딧 리필',
          metadata: { date: today, previous_balance: userCredit.balance }
        });

      return NextResponse.json({
        success: true,
        balance: DAILY_CREDIT_LIMIT,
        refilled: true,
        message: '일일 크레딧이 리필되었습니다.'
      });
    }

    // 오늘 이미 리필받았으면 현재 잔액 반환
    return NextResponse.json({
      success: true,
      balance: userCredit.balance,
      refilled: false,
      message: '오늘 이미 크레딧을 받았습니다.'
    });

  } catch (error: any) {
    console.error('[POST /api/credits/daily-refill] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
