import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * POST /api/auth/reset-password
 * 비밀번호 재설정 처리
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: '토큰과 비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 검증
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 8자 이상이어야 합니다.' },
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

    if (result.type !== 'password_reset') {
      return NextResponse.json(
        { success: false, error: '비밀번호 재설정 토큰이 아닙니다.' },
        { status: 400 }
      );
    }

    // Supabase Auth를 통해 비밀번호 업데이트
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      result.user_id,
      { password }
    );

    if (updateError) {
      logger.error('비밀번호 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '비밀번호 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 토큰 사용 처리
    await adminClient.rpc('mark_token_used', { p_token: token });

    logger.info(`비밀번호 재설정 완료: ${result.email}`);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 재설정되었습니다.'
    });

  } catch (error: any) {
    logger.error('POST /api/auth/reset-password 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
