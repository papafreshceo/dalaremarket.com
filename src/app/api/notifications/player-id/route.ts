import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler, createAdminClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { requireCsrfToken } from '@/lib/csrf';

/**
 * POST /api/notifications/player-id
 * OneSignal Player ID 저장/업데이트
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더가 없는 경우에만 CSRF 토큰 검증
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const csrfError = requireCsrfToken(request);
      if (csrfError) {
        logger.warn('CSRF token validation failed for Player ID POST');
        return csrfError;
      }
    }

    const supabase = await createClientForRouteHandler();
    const adminSupabase = createAdminClient(); // RLS 우회용

    // 현재 로그인한 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    // Rate Limiting 체크 (사용자당 1분에 10회)
    const identifier = `player-id:${user.id}`;
    const rateLimitResult = rateLimit(identifier, { maxRequests: 10, windowMs: 60 * 1000 });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      logger.warn('Player ID API rate limit exceeded', { userId: user.id, retryAfter });

      return NextResponse.json(
        {
          success: false,
          error: `요청이 너무 많습니다. ${retryAfter}초 후 다시 시도해주세요.`
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
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

    // Player ID가 이미 있는지 확인 (Admin Client 사용 - 시스템 레벨 작업)
    const { data: existing, error: selectError } = await adminSupabase
      .from('onesignal_player_ids')
      .select('id, user_id, created_at')
      .eq('player_id', player_id)
      .maybeSingle();

    if (selectError) {
      logger.error('Player ID 조회 실패', selectError);
      return NextResponse.json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (existing) {
      // 같은 사용자의 Player ID면 갱신
      if (existing.user_id === user.id) {
        const { data, error } = await adminSupabase
          .from('onesignal_player_ids')
          .update({
            last_active_at: new Date().toISOString(),
            is_active: true,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('Player ID 갱신 실패', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        logger.info('Player ID 갱신 완료', { playerId: player_id, userId: user.id });
        return NextResponse.json({
          success: true,
          message: 'Player ID가 갱신되었습니다.',
          data,
        });
      }

      // 다른 사용자의 Player ID인 경우 - 기존 레코드 비활성화 후 새로 생성
      logger.warn('Player ID 소유권 변경 감지', {
        playerId: player_id,
        oldUserId: existing.user_id,
        newUserId: user.id,
      });

      // 1. 기존 레코드 비활성화
      const { error: deactivateError } = await adminSupabase
        .from('onesignal_player_ids')
        .update({
          is_active: false,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (deactivateError) {
        logger.error('기존 Player ID 비활성화 실패', deactivateError);
      }

      // 2. 새 레코드 생성 (충돌 방지를 위해 타임스탬프 추가)
      const newPlayerId = `${player_id}_${Date.now()}`;
      const { data: newData, error: newError } = await adminSupabase
        .from('onesignal_player_ids')
        .insert({
          user_id: user.id,
          player_id: newPlayerId,
          device_type: device_type || 'web',
          device_model: device_model || 'Unknown',
          user_agent: userAgent,
          ip_address: ip,
          is_active: true,
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newError) {
        logger.error('새 Player ID 생성 실패', newError);
        return NextResponse.json({ success: false, error: newError.message }, { status: 500 });
      }

      logger.info('Player ID 재할당 완료 (새 레코드 생성)', {
        oldPlayerId: player_id,
        newPlayerId,
        oldUserId: existing.user_id,
        newUserId: user.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Player ID가 재할당되었습니다.',
        data: newData,
      });
    }

    // 새 Player ID 등록 (Admin Client 사용)
    const { data, error } = await adminSupabase
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
      // 중복 키 에러인 경우 성공으로 처리 (이미 등록됨)
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        logger.info('Player ID 중복 감지 - 성공으로 처리', { playerId: player_id });

        return NextResponse.json({
          success: true,
          message: 'Player ID가 이미 등록되어 있습니다.',
          data: { player_id, user_id: user.id }, // 가짜 데이터 반환
        });
      }

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
    // Authorization 헤더가 없는 경우에만 CSRF 토큰 검증
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const csrfError = requireCsrfToken(request);
      if (csrfError) {
        logger.warn('CSRF token validation failed for Player ID DELETE');
        return csrfError;
      }
    }

    const supabase = await createClientForRouteHandler();
    const adminSupabase = createAdminClient(); // RLS 우회용

    // 현재 로그인한 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    // Rate Limiting 체크 (사용자당 1분에 5회)
    const identifier = `player-id-delete:${user.id}`;
    const rateLimitResult = rateLimit(identifier, { maxRequests: 5, windowMs: 60 * 1000 });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      logger.warn('Player ID DELETE API rate limit exceeded', { userId: user.id, retryAfter });

      return NextResponse.json(
        {
          success: false,
          error: `요청이 너무 많습니다. ${retryAfter}초 후 다시 시도해주세요.`
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('player_id');

    if (!playerId) {
      // Player ID 없으면 해당 사용자의 모든 디바이스 비활성화
      const { error } = await adminSupabase
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
    const { error } = await adminSupabase
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
