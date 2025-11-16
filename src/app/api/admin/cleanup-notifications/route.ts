import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * GET /api/admin/cleanup-notifications
 * 30일 지난 알림 자동 삭제 (Cron Job용)
 *
 * Vercel Cron으로 매일 실행됩니다.
 */
export async function GET(request: NextRequest) {
  try {
    // Cron Secret 검증 (보안)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // 30일 지난 알림 삭제 함수 실행
    const { data, error } = await adminClient.rpc('cleanup_old_notifications');

    if (error) {
      logger.error('알림 정리 실패:', error);
      return NextResponse.json(
        { success: false, error: '알림 정리에 실패했습니다.', details: error },
        { status: 500 }
      );
    }

    const deletedCount = data || 0;

    logger.info(`30일 지난 알림 ${deletedCount}개 삭제 완료`);

    return NextResponse.json({
      success: true,
      message: `30일 지난 알림 ${deletedCount}개가 삭제되었습니다.`,
      deleted_count: deletedCount,
    });

  } catch (error: any) {
    logger.error('GET /api/admin/cleanup-notifications 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
