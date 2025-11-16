import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, replaceVariables } from '@/lib/email/send-email';
import { APP_URL } from '@/lib/email/resend';
import logger from '@/lib/logger';

/**
 * POST /api/auth/send-verification
 * 이메일 인증 메일 발송
 */
export async function POST(request: NextRequest) {
  try {
    const { email, user_id } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 사용자 조회
    let userId = user_id;
    if (!userId) {
      const { data: user } = await adminClient
        .from('users')
        .select('id, email_verified')
        .eq('email', email)
        .single();

      if (!user) {
        return NextResponse.json(
          { success: false, error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      if (user.email_verified) {
        return NextResponse.json(
          { success: false, error: '이미 인증된 이메일입니다.' },
          { status: 400 }
        );
      }

      userId = user.id;
    }

    // 기존 미사용 토큰 삭제
    await adminClient
      .from('auth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'email_verification')
      .eq('is_used', false);

    // 토큰 생성 (24시간 유효)
    const { data: tokenData, error: tokenError } = await adminClient
      .rpc('generate_auth_token', {
        p_type: 'email_verification',
        p_email: email,
        p_user_id: userId,
        p_expires_hours: 24
      });

    if (tokenError || !tokenData || tokenData.length === 0) {
      logger.error('토큰 생성 오류:', tokenError);
      return NextResponse.json(
        { success: false, error: '토큰 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const token = tokenData[0].token;
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`;

    // 이메일 템플릿 조회
    const { data: template } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('type', 'transactional')
      .ilike('name', '%이메일 인증%')
      .eq('is_active', true)
      .single();

    let html = '';
    let subject = '이메일 인증을 완료해주세요';

    if (template) {
      html = replaceVariables(template.html_content, {
        email,
        verification_url: verificationUrl
      });
      subject = replaceVariables(template.subject, { email });
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>달래마켓</h1>
            </div>
            <div class="content">
              <h2>이메일 인증</h2>
              <p>안녕하세요,</p>
              <p>달래마켓에 가입해 주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">이메일 인증하기</a>
              </p>
              <p style="font-size: 12px; color: #6b7280;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
                ${verificationUrl}
              </p>
              <p style="font-size: 12px; color: #dc2626;">
                이 링크는 24시간 동안 유효합니다.
              </p>
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
      emailType: 'email_verification',
      recipientName: email,
      metadata: {
        token,
        user_id: userId
      }
    });

    if (!result.success) {
      logger.error('이메일 발송 실패:', result);
      return NextResponse.json(
        { success: false, error: '이메일 발송에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info(`이메일 인증 발송: ${email}`);

    return NextResponse.json({
      success: true,
      message: '인증 이메일이 발송되었습니다.'
    });

  } catch (error: any) {
    logger.error('POST /api/auth/send-verification 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
