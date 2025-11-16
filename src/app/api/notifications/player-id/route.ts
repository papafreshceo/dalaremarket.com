import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

/**
 * POST /api/notifications/player-id
 * OneSignal Player ID 저장/업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { player_id, device_type, device_model } = body;

    if (!player_id) {
      return NextResponse.json(
        { success: false, error: 'Player ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // User-Agent와 IP 추출
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

    // Player ID가 이미 있는지 확인
    const { data: existing } = await supabase
      .from('onesignal_player_ids')
      .select('id, user_id')
      .eq('player_id', player_id)
      .single();

    if (existing) {
      // 이미 등록된 Player ID
      // 같은 사용자면 last_active_at 업데이트
      if (existing.user_id === user.id) {
        const { data, error } = await supabase
          .from('onesignal_player_ids')
          .update({
            last_active_at: new Date().toISOString(),
            is_active: true,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('Player ID 업데이트 실패', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Player ID가 갱신되었습니다.',
          data,
        });
      } else {
        // 다른 사용자의 Player ID를 현재 사용자에게 재할당
        const { data, error } = await supabase
          .from('onesignal_player_ids')
          .update({
            user_id: user.id,
            last_active_at: new Date().toISOString(),
            is_active: true,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('Player ID 재할당 실패', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        logger.info('Player ID 재할당 완료', {
          playerId: player_id,
          oldUserId: existing.user_id,
          newUserId: user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'Player ID가 재할당되었습니다.',
          data,
        });
      }
    }

    // 새 Player ID 등록
    const { data, error } = await supabase
      .from('onesignal_player_ids')
      .insert({
        user_id: user.id,
        player_id,
        device_type: device_type || 'web',
        device_model: device_model || 'Unknown',
        user_agent: userAgent,
        ip_address: ip,
        is_active: true,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Player ID 등록 실패', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    logger.info('Player ID 등록 완료', {
      userId: user.id,
      playerId: player_id,
      deviceType: device_type,
    });

    return NextResponse.json({
      success: true,
      message: 'Player ID가 등록되었습니다.',
      data,
    });
  } catch (error: any) {
    logger.error('POST /api/notifications/player-id 오류', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/player-id
 * Player ID 비활성화 (로그아웃 등)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('player_id');

    if (!playerId) {
      // Player ID 없으면 해당 사용자의 모든 디바이스 비활성화
      const { error } = await supabase
        .from('onesignal_player_ids')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        logger.error('모든 Player ID 비활성화 실패', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '모든 디바이스가 비활성화되었습니다.',
      });
    }

    // 특정 Player ID만 비활성화
    const { error } = await supabase
      .from('onesignal_player_ids')
      .update({ is_active: false })
      .eq('player_id', playerId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Player ID 비활성화 실패', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    logger.info('Player ID 비활성화 완료', { userId: user.id, playerId });

    return NextResponse.json({
      success: true,
      message: '디바이스가 비활성화되었습니다.',
    });
  } catch (error: any) {
    logger.error('DELETE /api/notifications/player-id 오류', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
