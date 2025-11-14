import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/api-security';

/**
 * GET /api/cash/settings
 * 캐시 설정 조회 (모든 사용자)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 캐시 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('cash_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error('[GET /api/cash/settings] 설정 조회 오류:', settingsError);
      return NextResponse.json(
        { success: false, error: '캐시 설정을 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error: any) {
    console.error('[GET /api/cash/settings] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cash/settings
 * 캐시 설정 수정 (관리자만)
 */
export async function PUT(request: NextRequest) {
  // 🔒 보안: 관리자만 접근 가능
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClientForRouteHandler();

    // 요청 본문 파싱
    const body = await request.json();
    const { login_reward, activity_reward_per_minute, daily_activity_limit } = body;

    // 유효성 검사
    if (
      typeof login_reward !== 'number' || login_reward < 0 ||
      typeof activity_reward_per_minute !== 'number' || activity_reward_per_minute < 0 ||
      typeof daily_activity_limit !== 'number' || daily_activity_limit < 0
    ) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 설정 값입니다.' },
        { status: 400 }
      );
    }

    // 기존 설정 조회
    const { data: existingSettings } = await supabase
      .from('cash_settings')
      .select('*')
      .limit(1)
      .single();

    if (existingSettings) {
      // 설정 업데이트
      const { error: updateError } = await supabase
        .from('cash_settings')
        .update({
          login_reward,
          activity_reward_per_minute,
          daily_activity_limit,
          updated_by: auth.user?.id
        })
        .eq('id', existingSettings.id);

      if (updateError) {
        console.error('[PUT /api/cash/settings] 설정 업데이트 오류:', updateError);
        return NextResponse.json(
          { success: false, error: '설정 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }
    } else {
      // 설정 생성
      const { error: insertError } = await supabase
        .from('cash_settings')
        .insert({
          login_reward,
          activity_reward_per_minute,
          daily_activity_limit,
          updated_by: auth.user?.id
        });

      if (insertError) {
        console.error('[PUT /api/cash/settings] 설정 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '설정 생성에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '캐시 설정이 업데이트되었습니다.',
      settings: {
        login_reward,
        activity_reward_per_minute,
        daily_activity_limit
      }
    });

  } catch (error: any) {
    console.error('[PUT /api/cash/settings] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
