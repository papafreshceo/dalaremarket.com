import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';
import { sendEmail, replaceVariables, getUnsubscribeUrl } from '@/lib/email/send-email';

/**
 * POST /api/admin/notifications/broadcast
 * 관리자가 모든 사용자에게 일괄 푸시 알림 전송
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { title, body, category, url, imageUrl, sendEmail: shouldSendEmail } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // OneSignal App ID와 API Key 확인
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'OneSignal 설정이 누락되었습니다.' },
        { status: 500 }
      );
    }

    // 모든 활성 Player ID 조회
    const { data: playerIds, error: fetchError } = await adminClient
      .from('onesignal_player_ids')
      .select('player_id')
      .eq('is_active', true);

    if (fetchError) {
      logger.error('Player ID 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Player ID 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!playerIds || playerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '푸시 알림을 받을 수 있는 사용자가 없습니다.' },
        { status: 400 }
      );
    }

    // OneSignal API로 푸시 알림 전송
    const notificationPayload: any = {
      app_id: appId,
      include_player_ids: playerIds.map(p => p.player_id),
      headings: { en: title },
      contents: { en: body },
      data: {
        category: category || 'broadcast',
        url: url || '/platform/notifications',
      },
      url: url || `${process.env.NEXT_PUBLIC_APP_URL}/platform/notifications`,
    };

    // 이미지가 있으면 추가 (Android, iOS, Web 모두 지원)
    if (imageUrl) {
      notificationPayload.big_picture = imageUrl; // Android
      notificationPayload.ios_attachments = { id1: imageUrl }; // iOS
      notificationPayload.chrome_web_image = imageUrl; // Web
    }

    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const oneSignalData = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      logger.error('OneSignal 전송 실패:', oneSignalData);
      return NextResponse.json(
        { success: false, error: 'OneSignal 전송에 실패했습니다.', details: oneSignalData },
        { status: 500 }
      );
    }

    // 전송 기록 저장
    const broadcastRecord: any = {
      title,
      body,
      category: category || 'broadcast',
      url: url || '/platform/notifications',
      sent_by: auth.user.id,
      recipient_count: playerIds.length,
      onesignal_notification_id: oneSignalData.id,
    };

    // 이미지 URL이 있으면 저장 (image_url 컬럼이 있다면)
    if (imageUrl) {
      broadcastRecord.image_url = imageUrl;
    }

    const { error: insertError } = await adminClient
      .from('notification_broadcasts')
      .insert(broadcastRecord);

    if (insertError) {
      logger.error('전송 기록 저장 오류:', insertError);
      // 기록 실패해도 전송은 성공으로 처리
    }

    // 🔔 이메일 발송 (옵션)
    let emailSent = 0;
    let emailFailed = 0;

    if (shouldSendEmail) {
      try {
        // 마케팅 이메일 수신 동의한 사용자 조회
        const { data: users, error: usersError } = await adminClient
          .from('users')
          .select('email, name, profile_name, unsubscribe_token')
          .eq('email_marketing', true)
          .not('email', 'is', null);

        if (usersError) {
          logger.error('이메일 수신 동의 사용자 조회 오류:', usersError);
        } else if (users && users.length > 0) {
          // 이메일 템플릿 조회
          const { data: template } = await adminClient
            .from('email_templates')
            .select('html_content')
            .eq('type', 'broadcast')
            .eq('is_active', true)
            .single();

          const htmlTemplate = template?.html_content || `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body>
              <h2>{title}</h2>
              <p>{content}</p>
              <p><a href="{unsubscribe_url}">수신 거부</a></p>
            </body>
            </html>
          `;

          // 각 사용자에게 이메일 전송
          for (const user of users) {
            const unsubscribeUrl = getUnsubscribeUrl(user.unsubscribe_token || '');
            const html = replaceVariables(htmlTemplate, {
              subject: title,
              title: title,
              content: body,
              unsubscribe_url: unsubscribeUrl
            });

            const result = await sendEmail({
              to: user.email,
              subject: title,
              html,
              emailType: 'broadcast',
              recipientName: user.profile_name || user.name || user.email,
              metadata: {
                category,
                url,
                notification_id: oneSignalData.id
              }
            });

            if (result.success) {
              emailSent += result.sent;
            }
            emailFailed += result.failed;
          }

          logger.info(`이메일 발송 완료: 성공 ${emailSent}, 실패 ${emailFailed}`);
        }
      } catch (emailError: any) {
        logger.error('이메일 발송 오류:', emailError);
        // 이메일 실패해도 푸시는 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      message: shouldSendEmail
        ? `푸시 ${playerIds.length}명, 이메일 ${emailSent}명에게 전송되었습니다.`
        : `${playerIds.length}명에게 푸시 알림이 전송되었습니다.`,
      notification_id: oneSignalData.id,
      recipient_count: playerIds.length,
      email_sent: emailSent,
      email_failed: emailFailed,
    });

  } catch (error: any) {
    logger.error('POST /api/admin/notifications/broadcast 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
