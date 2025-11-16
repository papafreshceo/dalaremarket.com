import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * POST /api/admin/notifications/broadcast
 * 관리자가 모든 사용자에게 일괄 푸시 알림 전송
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { title, body, category, url, imageUrl } = await request.json();

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

    return NextResponse.json({
      success: true,
      message: `${playerIds.length}명에게 푸시 알림이 전송되었습니다.`,
      notification_id: oneSignalData.id,
      recipient_count: playerIds.length,
    });

  } catch (error: any) {
    logger.error('POST /api/admin/notifications/broadcast 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
