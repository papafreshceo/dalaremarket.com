import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, replaceVariables } from '@/lib/email/send-email';
import { APP_URL } from '@/lib/email/resend';
import logger from '@/lib/logger';

/**
 * POST /api/auth/forgot-password
 * 비밀번호 재설정 이메일 발송
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 사용자 조회
    const { data: user } = await adminClient
      .from('users')
      .select('id, email, name, profile_name')
      .eq('email', email)
      .single();

    // 보안을 위해 사용자가 없어도 성공 메시지 반환
    if (!user) {
      logger.warn(`비밀번호 재설정 요청 - 존재하지 않는 이메일: ${email}`);
      return NextResponse.json({
        success: true,
        message: '비밀번호 재설정 이메일이 발송되었습니다.'
      });
    }

    // 기존 미사용 토큰 삭제
    await adminClient
      .from('auth_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'password_reset')
      .eq('is_used', false);

    // 토큰 생성 (1시간 유효)
    const { data: tokenData, error: tokenError } = await adminClient
      .rpc('generate_auth_token', {
        p_type: 'password_reset',
        p_email: email,
        p_user_id: user.id,
        p_expires_hours: 1
      });

    if (tokenError || !tokenData || tokenData.length === 0) {
      logger.error('토큰 생성 오류:', tokenError);
      return NextResponse.json(
        { success: false, error: '토큰 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const token = tokenData[0].token;
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

    // 이메일 템플릿 조회
    const { data: template } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('type', 'transactional')
      .ilike('name', '%비밀번호%')
      .eq('is_active', true)
      .single();

    let html = '';
    let subject = '비밀번호 재설정';

    if (template) {
      html = replaceVariables(template.html_content, {
        name: user.profile_name || user.name || email,
        email,
        reset_url: resetUrl
      });
      subject = replaceVariables(template.subject, {
        name: user.profile_name || user.name || email
      });
    } else {
      // 기본 템플릿
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px 20px; background: #ffffff; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>달래마켓</h1>
            </div>
            <div class="content">
              <h2>비밀번호 재설정</h2>
              <p>안녕하세요 ${user.profile_name || user.name || '고객'}님,</p>
              <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
              </p>
              <p style="font-size: 12px; color: #6b7280;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
                ${resetUrl}
              </p>
              <div class="warning">
                <p style="margin: 0; font-size: 13px; color: #dc2626;">
                  ⚠️ 이 링크는 1시간 동안만 유효합니다.<br>
                  본인이 요청하지 않았다면 이 이메일을 무시하세요.
                </p>
              </div>
            </div>
            <div class="footer">
              <p>이 메일은 달래마켓에서 발송되었습니다.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // 이메일 발송
    const result = await sendEmail({
      to: email,
      subject,
      html,
      emailType: 'password_reset',
      recipientName: user.profile_name || user.name || email,
      metadata: {
        token,
        user_id: user.id
      }
    });

    if (!result.success) {
      logger.error('이메일 발송 실패:', result);
      return NextResponse.json(
        { success: false, error: '이메일 발송에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info(`비밀번호 재설정 이메일 발송: ${email}`);

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 이메일이 발송되었습니다.'
    });

  } catch (error: any) {
    logger.error('POST /api/auth/forgot-password 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
