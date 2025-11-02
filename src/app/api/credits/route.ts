import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/credits
 * 현재 사용자의 크레딧 잔액 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.', balance: 0 },
        { status: 401 }
      );
    }

    // 크레딧 잔액 조회
    let { data: userCredit, error: creditError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    // 크레딧 계정이 없으면 생성
    if (creditError || !userCredit) {
      const { data: newCredit, error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: user.id, balance: 0 })
        .select('balance')
        .single();

      if (insertError) {
        console.error('[GET /api/credits] 크레딧 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '크레딧 정보를 생성할 수 없습니다.', balance: 0 },
          { status: 500 }
        );
      }
      userCredit = newCredit;
    }

    return NextResponse.json({
      success: true,
      balance: userCredit.balance
    });

  } catch (error: any) {
    console.error('[GET /api/credits] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.', balance: 0 },
      { status: 500 }
    );
  }
}
