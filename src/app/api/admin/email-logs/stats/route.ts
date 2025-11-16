import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/email-logs/stats
 * 이메일 발송 통계
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // 기본 쿼리 (전체 통계)
    let totalQuery = adminClient.from('email_logs').select('status', { count: 'exact' });
    let sentQuery = adminClient.from('email_logs').select('*', { count: 'exact' }).eq('status', 'sent');
    let failedQuery = adminClient.from('email_logs').select('*', { count: 'exact' }).eq('status', 'failed');

    // 날짜 필터
    if (startDate) {
      totalQuery = totalQuery.gte('created_at', startDate);
      sentQuery = sentQuery.gte('created_at', startDate);
      failedQuery = failedQuery.gte('created_at', startDate);
    }

    if (endDate) {
      totalQuery = totalQuery.lte('created_at', endDate);
      sentQuery = sentQuery.lte('created_at', endDate);
      failedQuery = failedQuery.lte('created_at', endDate);
    }

    const [totalResult, sentResult, failedResult] = await Promise.all([
      totalQuery,
      sentQuery,
      failedQuery
    ]);

    const total = totalResult.count || 0;
    const sent = sentResult.count || 0;
    const failed = failedResult.count || 0;

    // 타입별 통계
    let typeQuery = adminClient
      .from('email_logs')
      .select('email_type, status');

    if (startDate) {
      typeQuery = typeQuery.gte('created_at', startDate);
    }

    if (endDate) {
      typeQuery = typeQuery.lte('created_at', endDate);
    }

    const { data: typeData } = await typeQuery;

    // 타입별 집계
    const byType: Record<string, { total: number; sent: number; failed: number }> = {};

    typeData?.forEach((log) => {
      if (!byType[log.email_type]) {
        byType[log.email_type] = { total: 0, sent: 0, failed: 0 };
      }
      byType[log.email_type].total += 1;
      if (log.status === 'sent') {
        byType[log.email_type].sent += 1;
      } else if (log.status === 'failed') {
        byType[log.email_type].failed += 1;
      }
    });

    // 최근 7일 일별 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentData } = await adminClient
      .from('email_logs')
      .select('created_at, status')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // 날짜별 집계
    const byDate: Record<string, { date: string; sent: number; failed: number }> = {};

    recentData?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { date, sent: 0, failed: 0 };
      }
      if (log.status === 'sent') {
        byDate[date].sent += 1;
      } else if (log.status === 'failed') {
        byDate[date].failed += 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        sent,
        failed,
        success_rate: total > 0 ? ((sent / total) * 100).toFixed(2) : '0',
        by_type: byType,
        by_date: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
      }
    });

  } catch (error: any) {
    logger.error('GET /api/admin/email-logs/stats 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
