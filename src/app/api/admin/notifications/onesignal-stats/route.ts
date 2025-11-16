import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/notifications/onesignal-stats
 * OneSignal 대시보드 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'OneSignal 설정이 누락되었습니다.' },
        { status: 500 }
      );
    }

    // 1. 앱 정보 조회
    const appResponse = await fetch(`https://onesignal.com/api/v1/apps/${appId}`, {
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!appResponse.ok) {
      logger.error('OneSignal 앱 정보 조회 실패');
      return NextResponse.json(
        { success: false, error: 'OneSignal 앱 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    const appData = await appResponse.json();

    // 2. 최근 알림 목록 조회
    const notificationsResponse = await fetch(
      `https://onesignal.com/api/v1/notifications?app_id=${appId}&limit=10&offset=0`,
      {
        headers: {
          'Authorization': `Basic ${apiKey}`,
        },
      }
    );

    let recentNotifications = [];
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      recentNotifications = notificationsData.notifications || [];
    }

    // 3. 플레이어 통계 (구독자 수)
    // OneSignal API는 player 조회에 제한이 있으므로 데이터베이스에서 조회
    // 대신 앱 데이터에서 제공하는 통계를 사용

    return NextResponse.json({
      success: true,
      app: {
        id: appData.id,
        name: appData.name,
        players: appData.players,
        messageable_players: appData.messageable_players,
        updated_at: appData.updated_at,
        created_at: appData.created_at,
        gcm_key: appData.gcm_key ? '설정됨' : '미설정',
        chrome_web_origin: appData.chrome_web_origin,
        chrome_web_default_notification_icon: appData.chrome_web_default_notification_icon,
        chrome_web_sub_domain: appData.chrome_web_sub_domain,
      },
      recent_notifications: recentNotifications.map((n: any) => ({
        id: n.id,
        headings: n.headings,
        contents: n.contents,
        included_segments: n.included_segments,
        successful: n.successful,
        failed: n.failed,
        errored: n.errored,
        converted: n.converted,
        remaining: n.remaining,
        queued_at: n.queued_at,
        send_after: n.send_after,
        completed_at: n.completed_at,
        platform_delivery_stats: n.platform_delivery_stats,
      })),
      summary: {
        total_players: appData.players || 0,
        messageable_players: appData.messageable_players || 0,
        recent_notifications_count: recentNotifications.length,
      },
    });

  } catch (error: any) {
    logger.error('GET /api/admin/notifications/onesignal-stats 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
