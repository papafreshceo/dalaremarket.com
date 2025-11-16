import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

/**
 * GET /api/notifications/devices
 * 사용자의 등록된 디바이스 목록 조회
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

    // 사용자의 디바이스 목록 조회
    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false });

    if (error) {
      logger.error('디바이스 목록 조회 실패', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: devices,
    });
  } catch (error: any) {
    logger.error('GET /api/notifications/devices 오류', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/devices
 * 새 디바이스 토큰 등록
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

    const body = await request.json();
    const { device_token, device_type, device_name } = body;

    if (!device_token || !device_type) {
      return NextResponse.json(
        { success: false, error: '디바이스 토큰과 타입이 필요합니다.' },
        { status: 400 }
      );
    }

    // User-Agent와 IP 추출
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

    // 중복 체크: 같은 토큰이 이미 있는지 확인
    const { data: existing } = await supabase
      .from('user_devices')
      .select('id')
      .eq('device_token', device_token)
      .single();

    if (existing) {
      // 이미 등록된 토큰이면 last_used_at만 업데이트
      const { data, error } = await supabase
        .from('user_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        logger.error('디바이스 업데이트 실패', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '디바이스 토큰이 갱신되었습니다.',
        data,
      });
    }

    // 새 디바이스 등록
    const { data, error } = await supabase
      .from('user_devices')
      .insert({
        user_id: user.id,
        device_token,
        device_type,
        device_name,
        user_agent: userAgent,
        ip_address: ip,
        is_active: true,
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('디바이스 등록 실패', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    logger.info('디바이스 등록 성공', { userId: user.id, deviceType: device_type });

    return NextResponse.json({
      success: true,
      message: '디바이스가 등록되었습니다.',
      data,
    });
  } catch (error: any) {
    logger.error('POST /api/notifications/devices 오류', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/devices
 * 디바이스 토큰 삭제 (로그아웃 등)
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('id');
    const deviceToken = searchParams.get('token');

    if (!deviceId && !deviceToken) {
      return NextResponse.json(
        { success: false, error: '디바이스 ID 또는 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('user_devices')
      .delete()
      .eq('user_id', user.id);

    if (deviceId) {
      query = query.eq('id', deviceId);
    } else if (deviceToken) {
      query = query.eq('device_token', deviceToken);
    }

    const { error } = await query;

    if (error) {
      logger.error('디바이스 삭제 실패', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    logger.info('디바이스 삭제 성공', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: '디바이스가 삭제되었습니다.',
    });
  } catch (error: any) {
    logger.error('DELETE /api/notifications/devices 오류', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
