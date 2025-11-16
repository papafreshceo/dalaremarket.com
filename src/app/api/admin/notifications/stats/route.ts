import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/notifications/stats
 * 알림 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();

    // 1. 전체 알림 통계
    const { count: totalNotifications } = await adminClient
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    // 2. 읽은 알림 수
    const { count: readNotifications } = await adminClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', true);

    // 3. 전송된 알림 수 (is_sent = true)
    const { count: sentNotifications } = await adminClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_sent', true);

    // 4. 전송 실패한 알림 수
    const { count: failedNotifications } = await adminClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .not('send_error', 'is', null);

    // 5. 타입별 알림 수
    const { data: notificationsByType } = await adminClient
      .from('notifications')
      .select('type')
      .order('type');

    const typeStats = notificationsByType?.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {}) || {};

    // 6. 카테고리별 알림 수
    const { data: notificationsByCategory } = await adminClient
      .from('notifications')
      .select('category')
      .order('category');

    const categoryStats = notificationsByCategory?.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {}) || {};

    // 7. 최근 7일간 일별 알림 발송 수
    const { data: recentNotifications } = await adminClient
      .from('notifications')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const dailyStats = recentNotifications?.reduce((acc: Record<string, number>, curr) => {
      const date = new Date(curr.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // 8. 전체 공지 발송 통계
    const { data: broadcasts } = await adminClient
      .from('notification_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const { count: totalBroadcasts } = await adminClient
      .from('notification_broadcasts')
      .select('*', { count: 'exact', head: true });

    // 9. 활성 Player ID 수 (푸시 알림 구독자 수)
    const { count: activePlayerIds } = await adminClient
      .from('onesignal_player_ids')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalNotifications || 0,
        read: readNotifications || 0,
        sent: sentNotifications || 0,
        failed: failedNotifications || 0,
        read_rate: totalNotifications ? ((readNotifications || 0) / totalNotifications * 100).toFixed(2) : 0,
        sent_rate: totalNotifications ? ((sentNotifications || 0) / totalNotifications * 100).toFixed(2) : 0,
      },
      byType: typeStats,
      byCategory: categoryStats,
      dailyStats,
      broadcasts: {
        total: totalBroadcasts || 0,
        recent: broadcasts || [],
      },
      subscribers: {
        active: activePlayerIds || 0,
      },
    });

  } catch (error: any) {
    logger.error('GET /api/admin/notifications/stats 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
