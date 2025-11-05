import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cash
 * 사용자의 캐시 잔액 조회
 */
export async function GET(request: NextRequest) {
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

    // 사용자 캐시 잔액 조회
    const { data: userCash, error: cashError } = await dbClient
      .from('user_cash')
      .select('*')
      .eq('user_id', effectiveUserId)
      .single();

    // 캐시 잔액이 없으면 0 반환 (impersonate 모드에서는 생성하지 않음)
    if (cashError && cashError.code === 'PGRST116') {
      // impersonate 모드에서는 읽기만 하고 생성하지 않음
      if (impersonateUserId) {
        return NextResponse.json({
          success: true,
          balance: 0,
          user_id: effectiveUserId,
          isImpersonate: true
        });
      }

      const { data: newCash, error: insertError } = await dbClient
        .from('user_cash')
        .insert({ user_id: effectiveUserId, balance: 0 })
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
        user_id: effectiveUserId
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
      user_id: effectiveUserId
    });

  } catch (error: any) {
    console.error('[GET /api/cash] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
