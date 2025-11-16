import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import { sendEmail, replaceVariables, getUnsubscribeUrl } from '@/lib/email/send-email';
import logger from '@/lib/logger';

/**
 * POST /api/admin/scheduled-emails/execute
 * 예약된 이메일을 실행 (현재 시간 기준으로 발송 시간이 지난 것들)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();

    // 발송 시간이 지난 pending 상태의 예약 조회
    const { data: scheduledEmails, error: fetchError } = await adminClient
      .from('scheduled_emails')
      .select('*, template:email_templates(*)')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (fetchError) {
      logger.error('예약 이메일 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '예약 이메일 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: '발송할 예약 이메일이 없습니다.',
        executed: 0
      });
    }

    let executedCount = 0;
    let failedCount = 0;

    // 각 예약 이메일 처리
    for (const scheduled of scheduledEmails) {
      try {
        const template = scheduled.template;

        if (!template) {
          // 템플릿이 삭제된 경우
          await adminClient
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: '템플릿을 찾을 수 없습니다.',
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduled.id);
          failedCount++;
          continue;
        }

        // 수신자 정보 조회
        const { data: users, error: usersError } = await adminClient
          .from('users')
          .select('email, name, profile_name, unsubscribe_token')
          .in('email', scheduled.recipient_emails);

        if (usersError || !users || users.length === 0) {
          await adminClient
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: '수신자 정보를 찾을 수 없습니다.',
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduled.id);
          failedCount++;
          continue;
        }

        let sentCount = 0;
        let emailFailedCount = 0;

        // 각 수신자에게 이메일 전송
        for (let i = 0; i < users.length; i++) {
          const user = users[i];

          const unsubscribeUrl = getUnsubscribeUrl(user.unsubscribe_token || '');
          const mergedVariables = {
            name: user.profile_name || user.name || user.email,
            email: user.email,
            unsubscribe_url: unsubscribeUrl,
            ...scheduled.variables
          };

          const html = replaceVariables(template.html_content, mergedVariables);
          const subject = replaceVariables(template.subject, mergedVariables);

          const result = await sendEmail({
            to: user.email,
            subject,
            html,
            emailType: template.type,
            recipientName: user.profile_name || user.name || user.email,
            metadata: {
              scheduled_id: scheduled.id,
              is_scheduled: true
            }
          });

          if (result.success) {
            sentCount += result.sent;
          }
          emailFailedCount += result.failed;

          // Rate Limit 회피: 0.6초 대기
          if (i < users.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }

        // 예약 상태 업데이트
        await adminClient
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_count: sentCount,
            failed_count: emailFailedCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduled.id);

        executedCount++;
        logger.info(`예약 이메일 실행됨: ID ${scheduled.id}, 성공 ${sentCount}, 실패 ${emailFailedCount}`);

      } catch (emailError: any) {
        logger.error(`예약 이메일 실행 오류 (ID: ${scheduled.id}):`, emailError);

        await adminClient
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: emailError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduled.id);

        failedCount++;
      }
    }

    logger.info(`예약 이메일 실행 완료: 성공 ${executedCount}, 실패 ${failedCount}`);

    return NextResponse.json({
      success: true,
      message: `${executedCount}개의 예약 이메일이 발송되었습니다.`,
      executed: executedCount,
      failed: failedCount
    });

  } catch (error: any) {
    logger.error('POST /api/admin/scheduled-emails/execute 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
