import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import { sendEmail, replaceVariables, getUnsubscribeUrl } from '@/lib/email/send-email';
import logger from '@/lib/logger';

/**
 * POST /api/admin/send-email
 * 관리자가 특정 사용자에게 이메일 발송
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { recipient_emails, template_id, variables, custom_subject, custom_html } = await request.json();

    if (!recipient_emails || recipient_emails.length === 0) {
      return NextResponse.json(
        { success: false, error: '수신자를 선택해주세요.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    let subject = '';
    let htmlTemplate = '';
    let emailType = 'custom';

    // 템플릿 사용 또는 직접 입력
    if (template_id) {
      const { data: template, error: templateError } = await adminClient
        .from('email_templates')
        .select('*')
        .eq('id', template_id)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { success: false, error: '템플릿을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      subject = template.subject;
      htmlTemplate = template.html_content;
      emailType = template.type;
    } else if (custom_subject && custom_html) {
      subject = custom_subject;
      htmlTemplate = custom_html;
    } else {
      return NextResponse.json(
        { success: false, error: '템플릿을 선택하거나 직접 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 수신자 정보 조회
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('email, name, profile_name, unsubscribe_token')
      .in('email', recipient_emails);

    if (usersError || !users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: '수신자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let emailSent = 0;
    let emailFailed = 0;

    // 각 수신자에게 이메일 전송
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // 변수 치환
      const unsubscribeUrl = getUnsubscribeUrl(user.unsubscribe_token || '');
      const mergedVariables = {
        name: user.profile_name || user.name || user.email,
        email: user.email,
        unsubscribe_url: unsubscribeUrl,
        ...variables
      };

      const html = replaceVariables(htmlTemplate, mergedVariables);
      const finalSubject = replaceVariables(subject, mergedVariables);

      const result = await sendEmail({
        to: user.email,
        subject: finalSubject,
        html,
        emailType,
        recipientName: user.profile_name || user.name || user.email,
        metadata: {
          sent_by: auth.user.id,
          template_id,
          is_individual: true
        }
      });

      if (result.success) {
        emailSent += result.sent;
      }
      emailFailed += result.failed;

      // Rate Limit 회피: 0.6초 대기
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    logger.info(`개별 이메일 발송 완료: 성공 ${emailSent}, 실패 ${emailFailed} by ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: `${emailSent}명에게 이메일이 전송되었습니다.`,
      sent: emailSent,
      failed: emailFailed
    });

  } catch (error: any) {
    logger.error('POST /api/admin/send-email 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
