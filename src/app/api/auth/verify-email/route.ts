import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * POST /api/auth/verify-email
 * 이메일 인증 처리
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: '토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 토큰 검증
    const { data: verificationResult, error: verifyError } = await adminClient
      .rpc('verify_auth_token', { p_token: token });

    if (verifyError) {
      logger.error('토큰 검증 오류:', verifyError);
      return NextResponse.json(
        { success: false, error: '토큰 검증에 실패했습니다.' },
        { status: 500 }
      );
    }

    const result = verificationResult[0];

    if (!result.is_valid) {
      return NextResponse.json(
        { success: false, error: result.error_message || '유효하지 않은 토큰입니다.' },
        { status: 400 }
      );
    }

    if (result.type !== 'email_verification') {
      return NextResponse.json(
        { success: false, error: '이메일 인증 토큰이 아닙니다.' },
        { status: 400 }
      );
    }

    // 사용자 이메일 인증 상태 업데이트
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', result.user_id);

    if (updateError) {
      logger.error('사용자 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '이메일 인증 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 토큰 사용 처리
    await adminClient.rpc('mark_token_used', { p_token: token });

    logger.info(`이메일 인증 완료: ${result.email}`);

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      email: result.email
    });

  } catch (error: any) {
    logger.error('POST /api/auth/verify-email 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/verify-email?token=xxx
 * 이메일 인증 (쿼리 파라미터)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: '토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    // POST 메서드와 동일한 로직
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    return POST(postRequest);

  } catch (error: any) {
    logger.error('GET /api/auth/verify-email 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
