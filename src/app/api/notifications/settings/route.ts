import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

/**
 * GET /api/notifications/settings
 * 사용자의 알림 설정 조회
 */
export async function GET(request: NextRequest) {
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

    // 사용자의 알림 설정 조회
    let { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 설정이 없으면 기본값 생성
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: insertError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          push_enabled: true,
          announcements_enabled: true,
          order_status_enabled: true,
          comment_reply_enabled: true,
          marketing_enabled: false,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('알림 설정 생성 실패', insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      settings = newSettings;
    } else if (error) {
      logger.error('알림 설정 조회 실패', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    logger.error('GET /api/notifications/settings 오류', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/settings
 * 사용자의 알림 설정 업데이트
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      push_enabled,
      announcements_enabled,
      order_status_enabled,
      comment_reply_enabled,
      marketing_enabled,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
    } = body;

    // 설정 업데이트
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        push_enabled,
        announcements_enabled,
        order_status_enabled,
        comment_reply_enabled,
        marketing_enabled,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('알림 설정 업데이트 실패', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    logger.info('알림 설정 업데이트 성공', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: '알림 설정이 업데이트되었습니다.',
      data,
    });
  } catch (error: any) {
    logger.error('PUT /api/notifications/settings 오류', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
