import { resend, getFromAddress, isTestMode, testEmail, APP_URL } from './resend';
import { createAdminClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  emailType: string;
  metadata?: Record<string, any>;
  recipientName?: string;
}

/**
 * 이메일 전송 및 로그 기록
 */
export async function sendEmail({
  to,
  subject,
  html,
  emailType,
  metadata = {},
  recipientName
}: SendEmailOptions) {
  try {
    const supabase = createAdminClient();

    // 테스트 모드인 경우 수신자를 테스트 이메일로 변경
    const recipients = isTestMode
      ? [testEmail!]
      : (Array.isArray(to) ? to : [to]);

    // 이메일 전송
    const results = [];
    for (const recipient of recipients) {
      try {
        // Resend로 이메일 전송
        const { data, error } = await resend.emails.send({
          from: getFromAddress(),
          to: recipient,
          subject: isTestMode ? `[테스트] ${subject}` : subject,
          html
        });

        if (error) {
          logger.error('이메일 전송 실패:', error);

          // 실패 로그 기록
          await supabase.from('email_logs').insert({
            email_type: emailType,
            recipient_email: recipient,
            recipient_name: recipientName,
            subject,
            html_content: html,
            status: 'failed',
            error_message: error.message,
            metadata,
            created_at: new Date().toISOString()
          });

          results.push({ recipient, success: false, error: error.message });
        } else {
          // 성공 로그 기록
          await supabase.from('email_logs').insert({
            email_type: emailType,
            recipient_email: recipient,
            recipient_name: recipientName,
            subject,
            html_content: html,
            status: 'sent',
            resend_id: data?.id,
            metadata,
            created_at: new Date().toISOString(),
            sent_at: new Date().toISOString()
          });

          results.push({ recipient, success: true, resend_id: data?.id });
        }
      } catch (sendError: any) {
        logger.error(`이메일 전송 예외 (${recipient}):`, sendError);

        // 예외 로그 기록
        await supabase.from('email_logs').insert({
          email_type: emailType,
          recipient_email: recipient,
          recipient_name: recipientName,
          subject,
          html_content: html,
          status: 'failed',
          error_message: sendError.message,
          metadata,
          created_at: new Date().toISOString()
        });

        results.push({ recipient, success: false, error: sendError.message });
      }
    }

    // 전체 결과 반환
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    return {
      success: successCount > 0,
      sent: successCount,
      failed: failedCount,
      results
    };

  } catch (error: any) {
    logger.error('sendEmail 함수 오류:', error);
    return {
      success: false,
      sent: 0,
      failed: Array.isArray(to) ? to.length : 1,
      error: error.message
    };
  }
}

/**
 * HTML 템플릿에 변수 치환
 */
export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  // {variable} 형식의 변수를 실제 값으로 치환
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * 구독 취소 URL 생성
 */
export function getUnsubscribeUrl(unsubscribeToken: string): string {
  return `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
}
