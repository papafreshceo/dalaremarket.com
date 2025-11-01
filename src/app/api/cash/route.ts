import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cash
 * 사용자의 캐시 잔액 조회
 */
export async function GET(request: NextRequest) {
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

    // 사용자 캐시 잔액 조회
    const { data: userCash, error: cashError } = await supabase
      .from('user_cash')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 캐시 잔액이 없으면 0으로 초기화
    if (cashError && cashError.code === 'PGRST116') {
      const { data: newCash, error: insertError } = await supabase
        .from('user_cash')
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single();

      if (insertError) {
        console.error('[GET /api/cash] 캐시 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '캐시 정보를 생성할 수 없습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        balance: 0,
        user_id: user.id
      });
    }

    if (cashError) {
      console.error('[GET /api/cash] 캐시 조회 오류:', cashError);
      return NextResponse.json(
        { success: false, error: '캐시 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: userCash.balance,
      user_id: user.id
    });

  } catch (error: any) {
    console.error('[GET /api/cash] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
